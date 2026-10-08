import React, { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { sendOtp, verifyOtp } from "../services/api";

export default function OtpField({ phone, onPhoneChange, verified, onVerified }) {
  const [stage, setStage] = useState("idle");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setError("");
    setBusy(true);
    try {
      const result = await sendOtp(phone);
      if (result.verified) {
        onVerified(true);
        setStage("idle");
      } else {
        setStage("sent");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setError("");
    setBusy(true);
    try {
      const result = await verifyOtp(code);
      onVerified(result.user || true);
      setStage("idle");
      setCode("");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        Verify with Mobile Number <span className="text-red-500">*</span>
      </label>
      <div className="flex gap-2">
        <div className="flex items-center rounded-lg border px-3 text-sm text-gray-500">+91</div>
        <input
          type="tel"
          inputMode="numeric"
          value={phone}
          disabled={verified}
          onChange={(e) => onPhoneChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder="Enter mobile number"
          className="flex-1 rounded-lg border px-3 py-2.5 text-sm disabled:bg-gray-50"
        />
        {verified ? (
          <span className="flex items-center gap-1 rounded-lg bg-brand-50 px-3 text-sm text-brand-700">
            <CheckCircle2 size={16} />Verified
          </span>
        ) : (
          <button
            type="button"
            onClick={send}
            disabled={busy || phone.replace(/\D/g, "").length !== 10}
            className="rounded-lg border border-brand-600 px-4 text-sm text-brand-700 disabled:opacity-50"
          >
            {busy ? "Sending..." : "Send OTP"}
          </button>
        )}
      </div>

      {stage === "sent" && !verified && (
        <div className="mt-2 flex gap-2">
          <input
            value={code}
            inputMode="numeric"
            autoComplete="one-time-code"
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="6-digit code"
            maxLength={6}
            className="w-40 rounded-lg border px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={verify}
            disabled={busy || code.length !== 6}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {busy ? "Checking..." : "Verify"}
          </button>
        </div>
      )}

      {stage === "sent" && !verified && !error && (
        <p className="mt-1 text-xs text-gray-500">Your verification OTP has been generated. Check the backend terminal for the 6-digit code.</p>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
