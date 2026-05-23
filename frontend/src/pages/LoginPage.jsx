import { useState } from "react";
import { Eye, EyeOff, Loader2, LogIn, ShieldAlert } from "lucide-react";
import { useLogin } from "../services/useAuth";

export default function LoginPage({ onLoginSuccess, onGoToRegister, onGoToForgotPassword }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { submit, loading, error } = useLogin(onLoginSuccess);

  const handleSubmit = (e) => {
    e.preventDefault();
    submit({ email, password });
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome back</h1>
          <p>Sign in to the Pest Detection Console</p>
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
                autoComplete="current-password"
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

          <div className="auth-inline-action">
            <button type="button" className="link-button" onClick={onGoToForgotPassword}>
              Forgot password?
            </button>
          </div>

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? (
              <Loader2 size={18} className="spin" />
            ) : (
              <LogIn size={18} />
            )}
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account?{" "}
          <button type="button" className="link-button" onClick={onGoToRegister}>
            Create one
          </button>
        </p>
      </div>
    </div>
  );
}
