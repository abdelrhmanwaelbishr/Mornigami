import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { readAuthError, googleAuthErrorMessage, signInErrorMessage } from '@/lib/authErrors';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Moon, Sun } from 'lucide-react';
import '@/styles/login.css';

type AuthMode = 'signin' | 'signup' | 'forgot';
type FieldName = 'username' | 'email' | 'password' | 'confirmPassword';
type FieldErrors = Partial<Record<FieldName, string>>;
type LoginRouteState = { from?: { pathname?: string } } | null;

const GoogleMark: React.FC = () => (
  <svg
    className="h-[18px] w-[18px] shrink-0"
    viewBox="0 0 48 48"
    width="18"
    height="18"
    aria-hidden="true"
    focusable="false"
  >
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
  </svg>
);

export const Login: React.FC = () => {
  const { user, loading, signIn, signUp, signInWithGoogle, resetPassword, startupAuthError, clearStartupAuthError } =
    useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const routeState = location.state as LoginRouteState;
  const from = routeState?.from?.pathname || '/';

  // Modes: 'signin' | 'signup' | 'forgot'
  const [mode, setMode] = useState<AuthMode>('signin');

  // Form fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [alertNonce, setAlertNonce] = useState(0);

  const usernameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const modeChangeRequested = useRef(false);

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (!loading && user) {
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, from]);

  // After a failed request, send focus to the message that explains why.
  useEffect(() => {
    if (alertNonce > 0 && error) {
      alertRef.current?.focus();
    }
  }, [alertNonce, error]);

  // Switching modes replaces the form, so move focus to the first field.
  useEffect(() => {
    if (!modeChangeRequested.current) return;
    modeChangeRequested.current = false;
    if (mode === 'signup') {
      usernameRef.current?.focus();
    } else {
      emailRef.current?.focus();
    }
  }, [mode]);

  const announceError = (message: string) => {
    setError(message);
    setAlertNonce((nonce) => nonce + 1);
  };

  // A failed Google redirect lands back on this screen after a reload; show it once.
  useEffect(() => {
    if (!startupAuthError) return;
    setError(startupAuthError);
    setAlertNonce((nonce) => nonce + 1);
    clearStartupAuthError();
  }, [startupAuthError, clearStartupAuthError]);

  const handleGoogleSignIn = async () => {
    if (submitting || googleLoading) return;
    setError('');
    setSuccess('');
    setFieldErrors({});
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      // The auth-state effect above navigates as soon as the session lands.
    } catch (err: unknown) {
      console.error('Google sign-in error:', err);
      announceError(googleAuthErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  const clearFieldError = (field: FieldName) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    if (error) setError('');
  };

  const resetFormState = (newMode: AuthMode) => {
    if (newMode !== mode) modeChangeRequested.current = true;
    setMode(newMode);
    setError('');
    setSuccess('');
    setFieldErrors({});
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    if (newMode !== 'signin' && !email.includes('@')) {
      setEmail('');
    }
  };

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setError('');
    setSuccess('');
    setFieldErrors({});

    const nextErrors: FieldErrors = {};
    if (!email.trim()) nextErrors.username = 'Please provide your username or email.';
    if (!password) nextErrors.password = 'Please provide your password.';

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      if (nextErrors.username) {
        emailRef.current?.focus();
      } else {
        passwordRef.current?.focus();
      }
      return;
    }

    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      console.error('Sign in error:', err);
      announceError(signInErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setError('');
    setSuccess('');
    setFieldErrors({});

    const nextErrors: FieldErrors = {};
    if (!username.trim()) nextErrors.username = 'Please choose a username for your profile.';
    if (!email.trim()) nextErrors.email = 'Please enter a valid email address.';
    if (password.length < 6) nextErrors.password = 'Password must contain at least 6 characters.';
    if (password !== confirmPassword) nextErrors.confirmPassword = 'Passwords do not match. Please re-enter.';

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      if (nextErrors.username) {
        usernameRef.current?.focus();
      } else if (nextErrors.email) {
        emailRef.current?.focus();
      } else if (nextErrors.password) {
        passwordRef.current?.focus();
      } else {
        confirmPasswordRef.current?.focus();
      }
      return;
    }

    setSubmitting(true);
    try {
      await signUp(username.trim(), email.trim(), password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      console.error('Sign up error:', err);
      const { code, message } = readAuthError(err);
      let msg = 'Failed to create account. Please try again.';
      if (code === 'auth/email-already-in-use') {
        msg = 'This email is already associated with an account. Try signing in instead.';
      } else if (code === 'auth/invalid-email') {
        msg = 'The email address is not formatted correctly.';
      } else if (message) {
        msg = message;
      }
      announceError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setError('');
    setSuccess('');
    setFieldErrors({});

    if (!email.trim()) {
      setFieldErrors({ email: 'Please enter your email address.' });
      emailRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(email.trim());
      setSuccess('We sent a reset link to your email. Check your inbox.');
    } catch (err: unknown) {
      console.error('Password reset error:', err);
      const { code, message } = readAuthError(err);
      let msg = 'Failed to send password reset email.';
      if (code === 'auth/user-not-found') {
        msg = 'No account found with this email address.';
      } else if (message) {
        msg = message;
      }
      announceError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-page flex items-center justify-center px-5 py-10">
        <p role="status" className="flex items-center gap-3 text-[13px] text-[var(--auth-muted)]">
          <Loader2 className="auth-spinner animate-spin text-[var(--auth-primary)]" aria-hidden="true" />
          Checking your session…
        </p>
      </div>
    );
  }

  // The redirect effect is already navigating away.
  if (user) return null;

  const heading =
    mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create your account' : 'Reset password';

  const subtitle =
    mode === 'signin'
      ? 'Welcome back.'
      : mode === 'signup'
        ? 'Start folding your mornings into shape.'
        : 'We’ll email you a link to reset your password.';

  return (
    <div className="auth-page flex flex-col items-center justify-center px-5 py-10 sm:px-8 sm:py-16">
      <div className="auth-column w-full max-w-[380px]">
        <div className="auth-masthead">
          <div className="auth-wordmark">Mornigami</div>
          <button
            type="button"
            className="auth-theme-toggle"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <Sun className="h-[18px] w-[18px]" aria-hidden="true" />
            ) : (
              <Moon className="h-[18px] w-[18px]" aria-hidden="true" />
            )}
          </button>
        </div>

        <h1 className="auth-title mt-10">{heading}</h1>
        <p className="auth-subtitle mt-2.5">{subtitle}</p>

        <div className="mt-7">
          {error && (
            <div
              ref={alertRef}
              role="alert"
              aria-atomic="true"
              tabIndex={-1}
              className="auth-alert auth-alert-error mb-4"
            >
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div role="status" className="auth-alert auth-alert-success mb-4">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              <span>{success}</span>
            </div>
          )}

          {mode === 'signin' && (
            <>
              <form noValidate onSubmit={handleSignIn}>
                <div className="space-y-5">
                  <div>
                    <label htmlFor="signin-username" className="auth-label">
                      Email or username
                    </label>
                    <input
                      ref={emailRef}
                      id="signin-username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      autoCapitalize="none"
                      spellCheck={false}
                      className="auth-input"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        clearFieldError('username');
                      }}
                      aria-invalid={fieldErrors.username ? true : undefined}
                      aria-describedby={fieldErrors.username ? 'signin-username-error' : undefined}
                    />
                    {fieldErrors.username && (
                      <p id="signin-username-error" className="auth-field-error">
                        {fieldErrors.username}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="auth-label-row">
                      <label htmlFor="signin-password" className="auth-label">
                        Password
                      </label>
                      <button type="button" className="auth-link" onClick={() => resetFormState('forgot')}>
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        ref={passwordRef}
                        id="signin-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        className="auth-input auth-input-action"
                        value={password}
                        onChange={(event) => {
                          setPassword(event.target.value);
                          clearFieldError('password');
                        }}
                        aria-invalid={fieldErrors.password ? true : undefined}
                        aria-describedby={fieldErrors.password ? 'signin-password-error' : undefined}
                      />
                      <button
                        type="button"
                        className="auth-eye"
                        onClick={() => setShowPassword((visible) => !visible)}
                        aria-label="Show password"
                        aria-pressed={showPassword}
                      >
                        {showPassword ? (
                          <EyeOff className="h-[18px] w-[18px]" aria-hidden="true" />
                        ) : (
                          <Eye className="h-[18px] w-[18px]" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <p id="signin-password-error" className="auth-field-error">
                        {fieldErrors.password}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="auth-btn auth-btn-primary mt-6"
                  disabled={submitting}
                  aria-busy={submitting || undefined}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="auth-spinner animate-spin" aria-hidden="true" />
                      <span>Signing in…</span>
                    </>
                  ) : (
                    <span>Sign in</span>
                  )}
                </button>
              </form>

              <div className="auth-divider">
                <span>or</span>
              </div>

              <button
                type="button"
                className="auth-btn auth-btn-google"
                onClick={handleGoogleSignIn}
                disabled={submitting || googleLoading}
                aria-busy={googleLoading || undefined}
              >
                {googleLoading ? (
                  <>
                    <Loader2 className="auth-spinner animate-spin" aria-hidden="true" />
                    <span>Connecting to Google…</span>
                  </>
                ) : (
                  <>
                    <GoogleMark />
                    <span>Sign in with Google</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="auth-btn auth-btn-secondary mt-3"
                onClick={() => resetFormState('signup')}
              >
                Create an account
              </button>
            </>
          )}

          {mode === 'signup' && (
            <>
              <form noValidate onSubmit={handleSignUp}>
                <div className="space-y-5">
                  <div>
                    <label htmlFor="signup-username" className="auth-label">
                      Username
                    </label>
                    <input
                      ref={usernameRef}
                      id="signup-username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      autoCapitalize="none"
                      spellCheck={false}
                      className="auth-input"
                      value={username}
                      onChange={(event) => {
                        setUsername(event.target.value);
                        clearFieldError('username');
                      }}
                      aria-invalid={fieldErrors.username ? true : undefined}
                      aria-describedby={fieldErrors.username ? 'signup-username-error' : undefined}
                    />
                    {fieldErrors.username && (
                      <p id="signup-username-error" className="auth-field-error">
                        {fieldErrors.username}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="signup-email" className="auth-label">
                      Email
                    </label>
                    <input
                      ref={emailRef}
                      id="signup-email"
                      name="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      autoCapitalize="none"
                      spellCheck={false}
                      className="auth-input"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        clearFieldError('email');
                      }}
                      aria-invalid={fieldErrors.email ? true : undefined}
                      aria-describedby={fieldErrors.email ? 'signup-email-error' : undefined}
                    />
                    {fieldErrors.email && (
                      <p id="signup-email-error" className="auth-field-error">
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="auth-label-row">
                      <label htmlFor="signup-password" className="auth-label">
                        Password
                      </label>
                      <span className="auth-label-hint">At least 6 characters</span>
                    </div>
                    <div className="relative">
                      <input
                        ref={passwordRef}
                        id="signup-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        className="auth-input auth-input-action"
                        value={password}
                        onChange={(event) => {
                          setPassword(event.target.value);
                          clearFieldError('password');
                        }}
                        aria-invalid={fieldErrors.password ? true : undefined}
                        aria-describedby={fieldErrors.password ? 'signup-password-error' : undefined}
                      />
                      <button
                        type="button"
                        className="auth-eye"
                        onClick={() => setShowPassword((visible) => !visible)}
                        aria-label="Show new password"
                        aria-pressed={showPassword}
                      >
                        {showPassword ? (
                          <EyeOff className="h-[18px] w-[18px]" aria-hidden="true" />
                        ) : (
                          <Eye className="h-[18px] w-[18px]" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <p id="signup-password-error" className="auth-field-error">
                        {fieldErrors.password}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="signup-confirm-password" className="auth-label">
                      Confirm password
                    </label>
                    <input
                      ref={confirmPasswordRef}
                      id="signup-confirm-password"
                      name="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      className="auth-input"
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value);
                        clearFieldError('confirmPassword');
                      }}
                      aria-invalid={fieldErrors.confirmPassword ? true : undefined}
                      aria-describedby={
                        fieldErrors.confirmPassword ? 'signup-confirm-error' : undefined
                      }
                    />
                    {fieldErrors.confirmPassword && (
                      <p id="signup-confirm-error" className="auth-field-error">
                        {fieldErrors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="auth-btn auth-btn-primary mt-6"
                  disabled={submitting}
                  aria-busy={submitting || undefined}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="auth-spinner animate-spin" aria-hidden="true" />
                      <span>Creating account…</span>
                    </>
                  ) : (
                    <span>Create account</span>
                  )}
                </button>
              </form>

              <div className="mt-5 flex justify-center">
                <button type="button" className="auth-link" onClick={() => resetFormState('signin')}>
                  Back to sign in
                </button>
              </div>
            </>
          )}

          {mode === 'forgot' && (
            <>
              <form noValidate onSubmit={handleForgotPassword}>
                <div>
                  <label htmlFor="forgot-email" className="auth-label">
                    Email
                  </label>
                  <input
                    ref={emailRef}
                    id="forgot-email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    className="auth-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      clearFieldError('email');
                    }}
                    aria-invalid={fieldErrors.email ? true : undefined}
                    aria-describedby={fieldErrors.email ? 'forgot-email-error' : undefined}
                  />
                  {fieldErrors.email && (
                    <p id="forgot-email-error" className="auth-field-error">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="auth-btn auth-btn-primary mt-6"
                  disabled={submitting}
                  aria-busy={submitting || undefined}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="auth-spinner animate-spin" aria-hidden="true" />
                      <span>Sending link…</span>
                    </>
                  ) : (
                    <span>Send reset link</span>
                  )}
                </button>
              </form>

              <div className="mt-5 flex justify-center">
                <button type="button" className="auth-link" onClick={() => resetFormState('signin')}>
                  Back to sign in
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <p className="auth-footnote mt-2.5 w-full max-w-[380px]">Mornigami — shape your morning, fold your routine.</p>
    </div>
  );
};
