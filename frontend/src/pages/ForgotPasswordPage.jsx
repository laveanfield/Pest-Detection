import { useState } from "react";
import { Eye, EyeOff, KeyRound, Loader2, MailCheck, ShieldAlert } from "lucide-react";
import { useForgotPassword, useResetPassword } from "../services/useAuth";

function RequestResetForm({ onOtpSent, onGoToLogin }) {
  const [email, setEmail] = useState("");
  const { submit, loading, error } = useForgotPassword(onOtpSent);

  const handleSubmit = (event) => {
    event.preventDefault();
    submit({ email });
  };

  return (
    <>
      <div className="auth-header">
        <div className="auth-logo otp-logo">
          <KeyRound size={28} />
        </div>
        <h1>Reset password</h1>
        <p>Enter your email and we'll send a reset code.</p>
      </div>

      {error && (
        <div className="auth-alert" role="alert">
          <ShieldAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </label>

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? <Loader2 size={18} className="spin" /> : <MailCheck size={18} />}
          {loading ? "Sending code..." : "Send reset code"}
        </button>
      </form>

      <p className="auth-footer">
        Remembered it?{" "}
        <button type="button" className="link-button" onClick={onGoToLogin}>
          Sign in
        </button>
      </p>
    </>
  );
}

function ResetPasswordForm({ email, onResetSuccess, onBack }) {
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { submit, loading, error } = useResetPassword(onResetSuccess);

  const handleSubmit = (event) => {
    event.preventDefault();
    submit({ email, otp, new_password: password });
  };

  return (
    <>
      <div className="auth-header">
        <div className="auth-logo otp-logo">
          <MailCheck size={28} />
        </div>
        <h1>Enter reset code</h1>
        <p>
          We sent a 6-digit code to <strong>{email}</strong>
        </p>
      </div>

      {error && (
        <div className="auth-alert" role="alert">
          <ShieldAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-field">
          <span>OTP code</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            required
            autoComplete="one-time-code"
            className="otp-input"
          />
        </label>

        <label className="auth-field">
          <span>New password</span>
          <div className="input-with-icon">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="icon-toggle"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>

        <button className="auth-submit" type="submit" disabled={loading || otp.length < 6}>
          {loading ? <Loader2 size={18} className="spin" /> : <KeyRound size={18} />}
          {loading ? "Resetting..." : "Reset password"}
        </button>
      </form>

      <p className="auth-footer">
        Wrong email?{" "}
        <button type="button" className="link-button" onClick={onBack}>
          Go back
        </button>
      </p>
    </>
  );
}

export default function ForgotPasswordPage({ onGoToLogin, onResetSuccess }) {
  const [pendingEmail, setPendingEmail] = useState(null);

  return (
    <div className="auth-shell">
      <div className="auth-card">
        {pendingEmail ? (
          <ResetPasswordForm
            email={pendingEmail}
            onResetSuccess={onResetSuccess}
            onBack={() => setPendingEmail(null)}
          />
        ) : (
          <RequestResetForm onOtpSent={setPendingEmail} onGoToLogin={onGoToLogin} />
        )}
      </div>
    </div>
  );
}
