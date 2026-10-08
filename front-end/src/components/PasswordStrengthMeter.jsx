import React from "react";

function scorePassword(password) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(score, 4);
}

const LEVELS = [
  { label: "Very weak", color: "bg-red-400", text: "text-red-500" },
  { label: "Weak", color: "bg-orange-400", text: "text-orange-500" },
  { label: "Fair", color: "bg-amber-400", text: "text-amber-600" },
  { label: "Good", color: "bg-lime-500", text: "text-lime-600" },
  { label: "Strong", color: "bg-brand-600", text: "text-brand-700" },
];

export default function PasswordStrengthMeter({ password }) {
  if (!password) return null;
  const score = scorePassword(password);
  const level = LEVELS[score];

  return (
    <div className="mt-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((bar) => (
          <div
            key={bar}
            className={`h-1.5 flex-1 rounded-full transition-colors ${bar < score ? level.color : "bg-gray-200"}`}
          />
        ))}
      </div>
      <p className={`mt-1 text-xs font-medium ${level.text}`}>{level.label}</p>
    </div>
  );
}
