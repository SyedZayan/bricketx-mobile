import type { SerializedError } from '@reduxjs/toolkit';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

export type ErrorCategory =
  | 'network'
  | 'timeout'
  | 'auth'
  | 'forbidden'
  | 'validation'
  | 'conflict'
  | 'rate_limit'
  | 'server'
  | 'unknown';

export type ErrorActionType =
  | 'retry'
  | 'relogin'
  | 'kyc'
  | 'support'
  | 'dismiss'
  | 'none';

export interface AppError {
  category: ErrorCategory;
  title: string;
  message: string;
  nextStep: string;
  actionType: ErrorActionType;
  actionLabel: string;
  statusCode?: number;
  retryAfterSeconds?: number;
  fieldErrors?: string[];
  rawMessage?: string;
}

interface BackendErrorShape {
  message?: unknown;
  error?:
    | string
    | {
        message?: unknown;
        code?: unknown;
        details?: {
          formErrors?: unknown;
          fieldErrors?: Record<string, unknown>;
        };
      };
  errors?: unknown;
}

function isFetchBaseQueryError(err: unknown): err is FetchBaseQueryError {
  return typeof err === 'object' && err !== null && 'status' in err;
}

function isSerializedError(err: unknown): err is SerializedError {
  return (
    typeof err === 'object' &&
    err !== null &&
    ('message' in err || 'code' in err || 'name' in err) &&
    !('status' in err)
  );
}

function extractString(val: unknown): string | undefined {
  if (typeof val === 'string' && val.trim().length > 0) {
    return val.trim();
  }
  return undefined;
}

function extractFieldErrors(data: unknown): string[] | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const obj = data as BackendErrorShape;
  const collected: string[] = [];

  if (typeof obj.error === 'object' && obj.error?.details) {
    const { formErrors, fieldErrors } = obj.error.details;
    if (Array.isArray(formErrors)) {
      formErrors.forEach((item) => {
        const str = extractString(item);
        if (str) collected.push(str);
      });
    }
    if (fieldErrors && typeof fieldErrors === 'object') {
      Object.values(fieldErrors).forEach((val) => {
        if (Array.isArray(val)) {
          val.forEach((v) => {
            const str = extractString(v);
            if (str) collected.push(str);
          });
        } else {
          const str = extractString(val);
          if (str) collected.push(str);
        }
      });
    }
  }

  if (Array.isArray(obj.errors)) {
    obj.errors.forEach((item) => {
      const str = extractString(item);
      if (str) collected.push(str);
    });
  }

  return collected.length > 0 ? collected : undefined;
}

function extractBackendMessage(data: unknown): string | undefined {
  if (!data) return undefined;
  if (typeof data === 'string') return extractString(data);
  if (typeof data !== 'object') return undefined;

  const obj = data as BackendErrorShape;

  if (typeof obj.error === 'object' && obj.error !== null) {
    const nestedMsg = extractString(obj.error.message);
    if (nestedMsg) return nestedMsg;
  }

  const directMsg = extractString(obj.message);
  if (directMsg) return directMsg;

  if (typeof obj.error === 'string') {
    const errStr = extractString(obj.error);
    if (errStr) return errStr;
  }

  return undefined;
}

function isTechnicalOrJargonMessage(msg: string): boolean {
  const lower = msg.toLowerCase();
  return (
    lower.includes('econnrefused') ||
    lower.includes('enotfound') ||
    lower.includes('etimedout') ||
    lower.includes('network request failed') ||
    lower.includes('status code') ||
    lower.includes('sql') ||
    lower.includes('prisma') ||
    lower.includes('jwt') ||
    lower.includes('stack') ||
    lower.includes('undefined is not') ||
    lower.includes('cannot read properties')
  );
}

export function normalizeError(
  error: unknown,
  fallbackContext?: {
    actionLabel?: string;
    defaultMessage?: string;
    defaultNextStep?: string;
  }
): AppError {
  const defaultActionLabel = fallbackContext?.actionLabel || 'Try Again';
  const defaultNextStep =
    fallbackContext?.defaultNextStep ||
    'Please check your details and try again. If this keeps happening, contact support.';

  if (!error) {
    return {
      category: 'unknown',
      title: 'Something Went Wrong',
      message: fallbackContext?.defaultMessage || 'We could not complete that request.',
      nextStep: defaultNextStep,
      actionType: 'retry',
      actionLabel: defaultActionLabel,
    };
  }

  if (isFetchBaseQueryError(error)) {
    if (error.status === 'FETCH_ERROR') {
      return {
        category: 'network',
        title: 'No Internet Connection',
        message: 'We could not reach the server because your connection looks offline or unstable.',
        nextStep: 'Check your Wi-Fi or mobile data connection, then tap Retry.',
        actionType: 'retry',
        actionLabel: 'Retry',
        rawMessage: error.error,
      };
    }

    if (error.status === 'TIMEOUT_ERROR') {
      return {
        category: 'timeout',
        title: 'Request Timed Out',
        message: 'The server took too long to respond to your request.',
        nextStep: 'Wait a moment and tap Retry. If you are on a slow connection, try again shortly.',
        actionType: 'retry',
        actionLabel: 'Retry',
        rawMessage: error.error,
      };
    }

    if (error.status === 'PARSING_ERROR') {
      return {
        category: 'server',
        title: 'Unexpected Server Response',
        message: 'We received an unreadable response from the server.',
        nextStep: 'Tap Retry to refresh. If the issue persists, contact support.',
        actionType: 'support',
        actionLabel: 'Retry',
        rawMessage: error.error,
      };
    }

    if (typeof error.status === 'number') {
      const status = error.status;
      const backendMsg = extractBackendMessage(error.data);
      const safeBackendMsg =
        backendMsg && !isTechnicalOrJargonMessage(backendMsg) ? backendMsg : undefined;
      const fieldErrors = extractFieldErrors(error.data);

      if (status === 401) {
        return {
          category: 'auth',
          title: 'Session Expired',
          message: safeBackendMsg || 'Your sign-in session has expired for your security.',
          nextStep: 'Sign in again to continue where you left off.',
          actionType: 'relogin',
          actionLabel: 'Sign In Again',
          statusCode: status,
          rawMessage: backendMsg,
        };
      }

      if (status === 403) {
        const lower = (safeBackendMsg || '').toLowerCase();
        const isKycRelated = lower.includes('kyc') || lower.includes('verification') || lower.includes('identity');
        return {
          category: 'forbidden',
          title: isKycRelated ? 'Verification Required' : 'Access Not Allowed',
          message:
            safeBackendMsg ||
            (isKycRelated
              ? 'Your account verification needs to be completed or approved before continuing.'
              : 'You do not have permission to perform this action on your account.'),
          nextStep: isKycRelated
            ? 'Open your verification profile to check your status or submit missing details.'
            : 'Review your account status or reach out to support if you believe this is a mistake.',
          actionType: isKycRelated ? 'kyc' : 'support',
          actionLabel: isKycRelated ? 'Go to Verification' : 'Contact Support',
          statusCode: status,
          rawMessage: backendMsg,
        };
      }

      if (status === 404) {
        return {
          category: 'unknown',
          title: 'Item Not Found',
          message: safeBackendMsg || 'The requested record or page could not be found.',
          nextStep: 'Go back and refresh the list to see the latest items.',
          actionType: 'retry',
          actionLabel: 'Refresh',
          statusCode: status,
          rawMessage: backendMsg,
        };
      }

      if (status === 409) {
        return {
          category: 'conflict',
          title: 'Update Conflict',
          message:
            safeBackendMsg ||
            'This record was already updated or conflicts with an existing request.',
          nextStep: 'Refresh the screen to view the latest state before trying again.',
          actionType: 'retry',
          actionLabel: 'Refresh & Retry',
          statusCode: status,
          rawMessage: backendMsg,
        };
      }

      if (status === 400 || status === 422) {
        return {
          category: 'validation',
          title: 'Check Your Details',
          message:
            safeBackendMsg ||
            fieldErrors?.[0] ||
            'Some information you entered could not be accepted.',
          nextStep: 'Review the highlighted or required fields and try submitting again.',
          actionType: 'dismiss',
          actionLabel: 'Fix Details',
          statusCode: status,
          fieldErrors,
          rawMessage: backendMsg,
        };
      }

      if (status === 429) {
        return {
          category: 'rate_limit',
          title: 'Too Many Requests',
          message:
            safeBackendMsg ||
            'You have made several requests in a short time, so we paused temporarily to protect your account.',
          nextStep: 'Wait a minute and try again rather than tapping repeatedly.',
          actionType: 'retry',
          actionLabel: 'Try Again Later',
          statusCode: status,
          rawMessage: backendMsg,
        };
      }

      if (status >= 500) {
        return {
          category: 'server',
          title: 'Service Temporarily Unavailable',
          message:
            safeBackendMsg ||
            'Our servers are having trouble completing this request right now.',
          nextStep: 'Wait a moment and tap Retry. If the problem continues, contact support.',
          actionType: 'retry',
          actionLabel: 'Retry',
          statusCode: status,
          rawMessage: backendMsg,
        };
      }
    }
  }

  if (isSerializedError(error) || error instanceof Error) {
    const rawMsg = extractString((error as Error).message);
    if (rawMsg && !isTechnicalOrJargonMessage(rawMsg)) {
      const isNetworkLike =
        rawMsg.toLowerCase().includes('network') ||
        rawMsg.toLowerCase().includes('offline') ||
        rawMsg.toLowerCase().includes('internet');

      return {
        category: isNetworkLike ? 'network' : 'unknown',
        title: isNetworkLike ? 'No Internet Connection' : 'Action Could Not Complete',
        message: rawMsg,
        nextStep: isNetworkLike
          ? 'Check your internet connection and try again.'
          : defaultNextStep,
        actionType: 'retry',
        actionLabel: defaultActionLabel,
        rawMessage: rawMsg,
      };
    }

    return {
      category: 'unknown',
      title: 'Action Could Not Complete',
      message: fallbackContext?.defaultMessage || 'An unexpected error interrupted your request.',
      nextStep: defaultNextStep,
      actionType: 'retry',
      actionLabel: defaultActionLabel,
      rawMessage: rawMsg,
    };
  }

  return {
    category: 'unknown',
    title: 'Something Went Wrong',
    message: fallbackContext?.defaultMessage || 'We could not complete that request.',
    nextStep: defaultNextStep,
    actionType: 'retry',
    actionLabel: defaultActionLabel,
  };
}