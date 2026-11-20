import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  roles?: string[];
  fullName?: string | null;
  investorRfid?: string | null;
}

export type AuthStatus = 'unknown' | 'restoring' | 'unauthenticated' | 'authenticated';

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  mfaPending: boolean;
  retryAfterUntil: number | null; // Unix epoch ms
}

const initialState: AuthState = {
  status: 'unknown',
  user: null,
  mfaPending: false,
  retryAfterUntil: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthStatus: (state, action: PayloadAction<AuthStatus>) => {
      state.status = action.payload;
    },
    setAuthenticatedUser: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload;
      state.status = 'authenticated';
      state.mfaPending = false;
    },
    setMfaPending: (state, action: PayloadAction<boolean>) => {
      state.mfaPending = action.payload;
    },
    setRetryAfterUntil: (state, action: PayloadAction<number | null>) => {
      state.retryAfterUntil = action.payload;
    },
    logoutAction: (state) => {
      state.status = 'unauthenticated';
      state.user = null;
      state.mfaPending = false;
      state.retryAfterUntil = null;
    },
  },
});

export const {
  setAuthStatus,
  setAuthenticatedUser,
  setMfaPending,
  setRetryAfterUntil,
  logoutAction,
} = authSlice.actions;

export default authSlice.reducer;