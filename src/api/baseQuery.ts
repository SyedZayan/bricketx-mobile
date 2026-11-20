import {
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query';
import { Mutex } from 'async-mutex';
import { tokenMemory } from './tokenMemory';
import { secureSession } from '../utils/secureSession';
import { setRetryAfterUntil, logoutAction } from '../store/authSlice';

const mutex = new Mutex();
const BASIC_AUTH = process.env.EXPO_PUBLIC_BASIC_AUTH_TOKEN;

const rawBaseQuery = fetchBaseQuery({
  baseUrl: process.env.EXPO_PUBLIC_API_URL,
  prepareHeaders: (headers) => {
    headers.set('Accept', 'application/json');

    // 1. Bypass AWS Nginx / Reverse Proxy HTTP Basic Auth gate (if not in URL)
    if (BASIC_AUTH && !process.env.EXPO_PUBLIC_API_URL?.includes('@')) {
      headers.set('Authorization', `Basic ${BASIC_AUTH}`);
    }

    // 2. Attach Investor Bearer JWT if logged in
    const token = tokenMemory.getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  },
});

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  await mutex.waitForUnlock();
  let result = await rawBaseQuery(args, api, extraOptions);

  // 1. Handle HTTP 429 Rate Limiting
  if (result.error && result.error.status === 429) {
    const retryAfterHeader = result.meta?.response?.headers.get('retry-after');
    if (retryAfterHeader) {
      const seconds = parseInt(retryAfterHeader, 10);
      const waitMs = !isNaN(seconds) ? seconds * 1000 : 30000;
      api.dispatch(setRetryAfterUntil(Date.now() + waitMs));
    }
  }

  // 2. Handle HTTP 401 Unauthorized with Refresh Token Rotation
  if (result.error && result.error.status === 401) {
    const path = typeof args === 'string' ? args : args.url;
    const isPublicAuthRoute =
      path.includes('/auth/mobile/login') ||
      path.includes('/auth/mobile/refresh') ||
      path.includes('/auth/register') ||
      path.includes('/auth/verify-email') ||
      path.includes('/auth/forgot-password') ||
      path.includes('/auth/reset-password');

    if (!isPublicAuthRoute) {
      if (!mutex.isLocked()) {
        const release = await mutex.acquire();
        try {
          const storedRefreshToken = await secureSession.getRefreshToken();
          if (!storedRefreshToken) {
            handleSessionTermination(api);
            return result;
          }

          const refreshResult = await rawBaseQuery(
            {
              url: '/auth/mobile/refresh',
              method: 'POST',
              body: { refreshToken: storedRefreshToken },
            },
            api,
            extraOptions
          );

          if (refreshResult.data) {
            const data = refreshResult.data as {
              accessToken: string;
              refreshToken: string;
            };
            tokenMemory.setAccessToken(data.accessToken);
            await secureSession.setRefreshToken(data.refreshToken);

            // Retry original request with fresh access token
            result = await rawBaseQuery(args, api, extraOptions);
          } else {
            handleSessionTermination(api);
          }
        } finally {
          release();
        }
      } else {
        await mutex.waitForUnlock();
        result = await rawBaseQuery(args, api, extraOptions);
      }
    }
  }

  return result;
};

function handleSessionTermination(api: any) {
  secureSession.clear();
  tokenMemory.clear();
  api.dispatch(logoutAction());
  api.dispatch({ type: 'api/resetApiState' });
}