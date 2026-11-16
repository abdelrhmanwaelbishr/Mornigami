export type AuthErrorLike = { code?: string; message?: string };

/** Narrow an unknown thrown value to the shape Firebase Auth errors use. */
export const readAuthError = (err: unknown): AuthErrorLike => {
  if (err && typeof err === 'object') {
    const { code, message } = err as { code?: unknown; message?: unknown };
    return {
      code: typeof code === 'string' ? code : undefined,
      message: typeof message === 'string' ? message : undefined,
    };
  }
  return {};
};

/**
 * User-facing copy for email/username sign-in failures.
 *
 * Covers Firebase Auth rejects plus the Firestore permission failure that a
 * username lookup can hit when the account directory is not readable.
 */
export const signInErrorMessage = (err: unknown): string => {
  const { code, message } = readAuthError(err);

  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      return 'Invalid username/email or password. Please check your credentials.';
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Please try again later or reset your password.';
    case 'auth/invalid-email':
      return 'That email address is not valid.';
    case 'auth/network-request-failed':
      return 'Could not reach the sign-in service. Check your connection and try again.';
    case 'permission-denied':
      return 'This build cannot look up usernames. Please sign in with your email address.';
    default:
      if (message && /insufficient permissions/i.test(message)) {
        return 'This build cannot look up usernames. Please sign in with your email address.';
      }
      return message || 'Failed to sign in. Please verify your credentials.';
  }
};

/**
 * User-facing copy for Google sign-in failures.
 *
 * Provider/setup faults are described in terms the account owner can act on, while
 * the raw Firebase code stays in `code` for logs and console diagnostics.
 */
export const googleAuthErrorMessage = (err: unknown): string => {
  const { code, message } = readAuthError(err);

  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Google sign-in was cancelled. Try again, or use your email and password.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the Google sign-in window. Allow pop-ups for this site, then try again.';
    case 'auth/operation-not-allowed':
    case 'auth/configuration-not-found':
      return 'Google sign-in is not switched on for this site yet. Please use your email and password for now.';
    case 'auth/unauthorized-domain':
    case 'auth/invalid-continue-uri':
      return 'Google sign-in is not available on this address. Please use your email and password.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email. Sign in with your email and password instead.';
    case 'auth/network-request-failed':
      return 'Could not reach Google. Check your connection and try again.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    default:
      return message || 'Google sign-in failed. Please try again.';
  }
};
