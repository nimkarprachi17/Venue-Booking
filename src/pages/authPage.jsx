import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export function createAuthPage(model) {
  const {
    authView,
    signupStep,
    recovering,
    page,
    field,
    button,
    go,
    setLoginError,
    accessReviewStatus,
    role,
    loginEmail,
    setLoginEmail,
    loginError,
    recoverySent,
    setRecoverySent,
    otpCode,
    setOtpCode,
    signupBusy,
    verifyRegistrationOtp,
    resendWait,
    resendRegistrationOtp,
    cancelRegistration,
    signupName,
    setSignupName,
    signupRole,
    setSignupRole,
    signupSpecifications,
    setSignupSpecifications,
    signupPassword,
    setSignupPassword,
    signupConfirm,
    setSignupConfirm,
    startRegistration,
    showPassword,
    setShowPassword,
    loginPassword,
    setLoginPassword,
    loginLoading,
    signIn,
  } = model;
  const specificationField = (label, key, placeholder, type = 'text') =>
    field(
      label,
      <input
        name={`signup${key}`}
        type={type}
        placeholder={placeholder}
        value={signupSpecifications[key]}
        onChange={(event) => {
          setSignupSpecifications((current) => ({ ...current, [key]: event.target.value }));
          setLoginError('');
        }}
      />,
      '',
      true,
    );

  const roleSpecificationFields = () => {
    if (signupRole === 'Faculty') {
      return specificationField('Position', 'position', 'e.g. Assistant Professor');
    }
    if (signupRole === 'Class Representative') {
      return (
        <div className="signup-specification-grid">
          {specificationField('Year', 'year', 'e.g. Third year')}
          {specificationField('Branch', 'branch', 'e.g. Computer Engineering')}
          {specificationField('Class / division', 'className', 'e.g. CSE A')}
        </div>
      );
    }
    if (signupRole === 'Club Head') {
      return (
        <div className="signup-specification-grid">
          {specificationField('Club name', 'clubName', 'e.g. Coding Club')}
          {specificationField('Position', 'position', 'e.g. President')}
        </div>
      );
    }
    return null;
  };
  const login = () => (
    <div className="login-screen">
      <div className={`login-card ${authView === 'signup' ? 'signup-card' : ''}`}>
        <a className="brand" href="#" onClick={(e) => e.preventDefault()}>
          <span className="brand-mark">B</span>
          <span>
            Book a Room<small>Venue booking system</small>
          </span>
        </a>
        {page === 'Access Pending' ? (
          <section className="access-pending" aria-live="polite">
            <span className="eyebrow">ACCOUNT ACCESS</span>
            <h1>
              {accessReviewStatus === 'rejected'
                ? 'Profile approval required'
                : 'Your profile is awaiting approval'}
            </h1>
            <p>
              {accessReviewStatus === 'rejected'
                ? 'Your role request was not approved. Contact your college administrator for details before trying again.'
                : `Your ${role} profile is waiting for administrator approval. Sign in again after approval to access Book a Room and see your notification.`}
            </p>
            <div className="access-review-status">
              <span>Status</span>
              <b>{accessReviewStatus === 'rejected' ? 'Rejected' : 'Pending review'}</b>
            </div>
            <button
              className="button primary full"
              onClick={() => {
                setLoginPassword('');
                setLoginError('');
                go('Sign in');
              }}
            >
              Back to sign in
            </button>
          </section>
        ) : (
          <>
            {!recovering && !(authView === 'signup' && signupStep === 'otp') && (
              <div className="auth-tabs" role="tablist" aria-label="Account access">
                <button
                  role="tab"
                  aria-selected={authView === 'signin'}
                  className={authView === 'signin' ? 'active' : ''}
                  onClick={() => {
                    go('Sign in');
                    setLoginError('');
                  }}
                >
                  Sign in
                </button>
                <button
                  role="tab"
                  aria-selected={authView === 'signup'}
                  className={authView === 'signup' ? 'active' : ''}
                  onClick={() => {
                    go('Sign up');
                    setLoginError('');
                  }}
                >
                  Sign up
                </button>
              </div>
            )}
            {recovering ? (
              <>
                <h1>Reset your password</h1>
                <p>
                  Enter your college email and we’ll send reset instructions if an account exists.
                </p>
                {field(
                  'College email',
                  <input
                    name="recoveryEmail"
                    type="email"
                    autoComplete="email"
                    placeholder="name@college.edu"
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      setLoginError('');
                    }}
                  />,
                )}
                {loginError && (
                  <div className="login-error" role="alert">
                    <AlertCircle size={15} />
                    {loginError}
                  </div>
                )}
                {recoverySent && (
                  <div className="login-success" role="status">
                    <CheckCircle2 size={15} />
                    If an account exists, reset instructions will be sent to this email.
                  </div>
                )}
                {button(
                  recoverySent ? 'Send again' : 'Send reset instructions',
                  () => {
                    if (!/.+@.+\..+/.test(loginEmail)) {
                      setLoginError('Enter a valid college email address.');
                      return;
                    }
                    setLoginError('');
                    setRecoverySent(true);
                  },
                  'primary full',
                )}
                <button
                  className="back-to-login"
                  onClick={() => {
                    setRecovering(false);
                    setRecoverySent(false);
                    setLoginError('');
                    go('Sign in');
                  }}
                >
                  Back to sign in
                </button>
              </>
            ) : authView === 'signup' && signupStep === 'otp' ? (
              <>
                <h1>Verify your college email</h1>
                <p>
                  Enter the six-digit code we sent to <strong>{loginEmail}</strong>. The code
                  expires in 10 minutes.
                </p>
                {field(
                  'Email verification code',
                  <input
                    name="otpCode"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength="6"
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => {
                      setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                      setLoginError('');
                    }}
                  />,
                )}
                {loginError && (
                  <div className="login-error" role="alert">
                    <AlertCircle size={15} />
                    {loginError}
                  </div>
                )}
                {button(
                  signupBusy ? 'Verifying…' : 'Verify email',
                  verifyRegistrationOtp,
                  'primary full',
                )}
                <div className="otp-actions">
                  <button
                    className="text-button"
                    disabled={signupBusy || resendWait > 0}
                    onClick={resendRegistrationOtp}
                  >
                    {resendWait > 0 ? `Resend code in ${resendWait}s` : 'Resend code'}
                  </button>
                  <button className="text-button" onClick={cancelRegistration}>
                    Change details
                  </button>
                </div>
              </>
            ) : recovering ? null : authView === 'signup' ? (
              <>
                <h1>Create your account</h1>
                <p>Register with your college email to book campus venues.</p>
                {field(
                  'Full name',
                  <input
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    placeholder="Your name"
                    value={signupName}
                    onChange={(e) => {
                      setSignupName(e.target.value);
                      setLoginError('');
                    }}
                  />,
                )}
                {field(
                  'College email',
                  <input
                    name="registrationEmail"
                    type="email"
                    autoComplete="email"
                    placeholder="name@college.edu"
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      setLoginError('');
                    }}
                  />,
                )}
                {field(
                  'College role',
                  <select
                    name="signupRole"
                    value={signupRole}
                    onChange={(e) => setSignupRole(e.target.value)}
                  >
                    <option>Faculty</option>
                    <option>Class Representative</option>
                    <option>Club Head</option>
                  </select>,
                )}
                <section className="signup-specifications" aria-label="Role details">
                  <h2>Role details</h2>
                  {roleSpecificationFields()}
                </section>
                {field(
                  'Password',
                  <input
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    value={signupPassword}
                    onChange={(e) => {
                      setSignupPassword(e.target.value);
                      setLoginError('');
                    }}
                  />,
                )}
                {field(
                  'Confirm password',
                  <input
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    value={signupConfirm}
                    onChange={(e) => {
                      setSignupConfirm(e.target.value);
                      setLoginError('');
                    }}
                  />,
                )}
                {loginError && (
                  <div className="login-error" role="alert">
                    <AlertCircle size={15} />
                    {loginError}
                  </div>
                )}
                {button(
                  signupBusy ? 'Sending code…' : 'Send verification code',
                  startRegistration,
                  'primary full',
                )}
                <small className="login-foot">
                  CR and Club Head accounts need role authorization before booking.
                </small>
              </>
            ) : (
              <>
                <h1>Sign in to your account</h1>
                <p>Use your college account to continue.</p>
                {field(
                  'College email',
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@college.edu"
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      setLoginError('');
                    }}
                  />,
                )}
                {field(
                  'Password',
                  <div className="password-wrap">
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        setLoginError('');
                      }}
                    />
                    <button onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>,
                )}
                {loginError && (
                  <div className="login-error" role="alert">
                    <AlertCircle size={15} />
                    {loginError}
                  </div>
                )}
                <div className="login-options">
                  <label>
                    <input type="checkbox" name="rememberMe" /> Remember me
                  </label>
                  <button
                    className="text-button"
                    onClick={() => {
                      go('Forgot password');
                      setLoginError('');
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
                {button(loginLoading ? 'Signing in…' : 'Sign in', signIn, 'primary full')}
                <small className="login-foot">
                  Need access? Contact your college administrator.
                </small>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
  return login;
}
