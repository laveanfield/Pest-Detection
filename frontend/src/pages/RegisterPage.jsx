import { useState } from "react";
import {
  Eye,
  EyeOff,
  Loader2,
  MailCheck,
  ShieldAlert,
  UserPlus,
} from "lucide-react";
import { useRegister, useVerifyOtp } from "../services/useAuth";

// ── Step 1: Registration form ────────────────────────────────────────────────
function RegisterForm({ onOtpRequired, onGoToLogin }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { submit, loading, error } = useRegister(onOtpRequired);

  const handleSubmit = (e) => {
    e.preventDefault();
    submit({ username, email, password });
  };

  return (
    <>
      <div className="auth-header">
        <h1>Create account</h1>
        <p>Join the Pest Detection Console</p>
      </div>

      {error && (
        <div className="auth-alert" role="alert">
          <ShieldAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-field">
          <span>Username</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="your_name"
            required
            autoComplete="username"
          />
        </label>

        <label className="auth-field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </label>

        <label className="auth-field">
          <span>Password</span>
          <div className="input-with-icon">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="icon-toggle"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? (
            <Loader2 size={18} className="spin" />
          ) : (
            <UserPlus size={18} />
          )}
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="auth-footer">
        Already have an account?{" "}
        <button type="button" className="link-button" onClick={onGoToLogin}>
          Sign in
        </button>
      </p>
    </>
  );
}

// ── Step 2: OTP verification ─────────────────────────────────────────────────
function OtpForm({ email, onVerified, onBack }) {
  const [otp, setOtp] = useState("");
  const { submit, loading, error } = useVerifyOtp(onVerified);

  const handleSubmit = (e) => {
    e.preventDefault();
    submit({ email, otp });
  };

  return (
    <>
      <div className="auth-header">
        <div className="auth-logo otp-logo">
          <MailCheck size={28} />
        </div>
        <h1>Verify your email</h1>
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
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            required
            autoComplete="one-time-code"
            className="otp-input"
          />
        </label>

        <button className="auth-submit" type="submit" disabled={loading || otp.length < 6}>
          {loading ? (
            <Loader2 size={18} className="spin" />
          ) : (
            <MailCheck size={18} />
          )}
          {loading ? "Verifying…" : "Verify email"}
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

// ── Main register page ────────────────────────────────────────────────────────
export default function RegisterPage({ onGoToLogin, onVerified }) {
  // pendingEmail: null = show form, string = show OTP step
  const [pendingEmail, setPendingEmail] = useState(null);

  return (
    <div className="auth-shell">
      <div className="auth-card">
        {pendingEmail ? (
          <OtpForm
            email={pendingEmail}
            onVerified={onVerified}
            onBack={() => setPendingEmail(null)}
          />
        ) : (
          <RegisterForm
            onOtpRequired={setPendingEmail}
            onGoToLogin={onGoToLogin}
          />
        )}
      </div>
    </div>
  );
}
