import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import hero from "../assets/hero-illustration.svg";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";
import { useAuth } from "../context/AuthContext";
import { resendVerificationEmail } from "../services/api";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const [tab, setTab] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [signupSent, setSignupSent] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [verificationRequired, setVerificationRequired] = useState(false);

  const { login, signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
  const initializeGoogle = () => {
    if (!window.google) return;

    const googleButton = document.getElementById("googleSignInButton");

    if (!googleButton) return;

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
    });

    googleButton.innerHTML = "";

    window.google.accounts.id.renderButton(
      googleButton,
      {
        theme: "outline",
        size: "large",
      }
    );
  };

  if (window.google) {
    initializeGoogle();
  } else {
    const interval = setInterval(() => {
      if (window.google) {
        clearInterval(interval);
        initializeGoogle();
      }
    }, 100);

    return () => clearInterval(interval);
  }
}, []);

  const emailError = emailTouched && email && !EMAIL_REGEX.test(email) ? "Enter a valid email address." : "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setVerificationRequired(false);
    setEmailTouched(true);

    if (!EMAIL_REGEX.test(email)) {
      setError("Enter a valid email address.");
      return;
    }

    setBusy(true);
    try {
      if (tab === "signin") {
        await login(email, password);
      } else {
        await signup(email, password);
        setVerificationEmail(email.trim().toLowerCase());
        setSignupSent(true);
      }
      if (tab === "signin") navigate("/");
    } catch (err) {
      setError(err.message);
      const message = err.message?.toLowerCase() || "";
      if (tab === "signin" && message.includes("verify your email")) {
        setVerificationRequired(true);
        setVerificationEmail(email.trim().toLowerCase());
      }
      if (tab === "signup" && message.includes("account already exists but is not verified")) {
        setSignupSent(true);
        setVerificationEmail(email.trim().toLowerCase());
      }
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleResponse = async (response) => {
    try {
        await loginWithGoogle(response.credential);
        navigate("/");
    } catch (err) {
        setError(err.message);
    }
};


  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-brand-800 to-brand-900 px-4 py-10">
      <div className="bg-dot-grid pointer-events-none absolute inset-0 opacity-50" />
      <img src={hero} alt="" className="pointer-events-none absolute bottom-0 left-0 w-full opacity-60" />

      <div className="relative z-10 w-full max-w-md text-center text-white">
        <h1 className="text-3xl font-semibold tracking-tight">LosttoFound</h1>
        <p className="mt-2 text-white/80">Things get lost. People find them.</p>

        <div className="mt-8 rounded-2xl bg-white p-6 text-left text-gray-900 shadow-premium ring-1 ring-black/5 sm:p-8">
          <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1 text-sm font-medium">
            <button
              onClick={() => setTab("signin")}
              className={`rounded-lg py-2 transition-colors ${
                tab === "signin" ? "bg-brand-700 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setTab("signup")}
              className={`rounded-lg py-2 transition-colors ${
                tab === "signup" ? "bg-brand-700 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Sign Up
            </button>
          </div>

          {verificationRequired && tab === "signin" && (
            <div className="mb-5 rounded-lg bg-brand-50 p-4 text-sm text-brand-800">
              <p className="font-semibold">Email verification required</p>
              <p className="mt-1">Verify <span className="font-medium">{verificationEmail}</span> before signing in.</p>
              <button
                type="button"
                disabled={resending}
                onClick={async () => {
                  setError(""); setResending(true);
                  try { const result = await resendVerificationEmail(verificationEmail); setError(result.message); }
                  catch (err) { setError(err.message); }
                  finally { setResending(false); }
                }}
                className="mt-3 text-xs font-semibold text-brand-700 hover:underline disabled:opacity-60"
              >
                {resending ? "Sending..." : "Resend verification email"}
              </button>
            </div>
          )}

          {signupSent && tab === "signup" && (
            <div className="mb-5 rounded-lg bg-brand-50 p-4 text-sm text-brand-800">
              <p className="font-semibold">Check your email</p>
              <p className="mt-1">We sent a verification link to <span className="font-medium">{verificationEmail}</span>. Verify it before signing in.</p>
              <button
                type="button"
                disabled={resending}
                onClick={async () => {
                  setError(""); setResending(true);
                  try { const result = await resendVerificationEmail(verificationEmail); setError(result.message); }
                  catch (err) { setError(err.message); }
                  finally { setResending(false); }
                }}
                className="mt-3 text-xs font-semibold text-brand-700 hover:underline disabled:opacity-60"
              >
                {resending ? "Sending..." : "Resend verification email"}
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  placeholder="you@example.com"
                  className={`w-full rounded-lg border py-2.5 pl-9 pr-3 text-sm transition-colors focus:outline-none focus:ring-1 ${
                    emailError
                      ? "border-red-300 focus:border-red-400 focus:ring-red-400"
                      : "border-gray-300 focus:border-brand-500 focus:ring-brand-500"
                  }`}
                />
              </div>
              {emailError && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
                  <AlertCircle size={12} /> {emailError}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={tab === "signup" ? 8 : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-9 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {tab === "signup" && <PasswordStrengthMeter password={password} />}
            </div>

            {tab === "signin" && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-gray-600">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="font-medium text-brand-700 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {error && (
              <p className="flex items-center gap-1.5 text-sm text-red-500">
                <AlertCircle size={14} /> {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-brand-700 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-800 disabled:opacity-60"
            >
              {busy ? "Please wait..." : tab === "signin" ? "Sign In" : "Sign Up"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-gray-400">
            <div className="h-px flex-1 bg-gray-200" /> OR <div className="h-px flex-1 bg-gray-200" />
          </div>

          <div id="googleSignInButton">
            </div>
          

          <p className="mt-5 text-center text-sm text-gray-500">
            {tab === "signin" ? (
              <>
                Don't have an account?{" "}
                <button onClick={() => setTab("signup")} className="font-medium text-brand-700 hover:underline">
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button onClick={() => setTab("signin")} className="font-medium text-brand-700 hover:underline">
                  Sign In
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

