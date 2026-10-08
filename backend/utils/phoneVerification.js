import crypto from "crypto";

export const normalizeIndianPhone = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return null;
};

export const generatePhoneOtp = () => String(crypto.randomInt(100000, 1000000));

export const hashPhoneOtp = (code) =>
  crypto.createHash("sha256").update(String(code)).digest("hex");

export const sendPhoneVerification = async (phone, code) => {
  console.log(`Phone OTP for ${phone}: ${code}`);
  return { status: "pending" };
};

export const checkPhoneVerification = (code, expectedHash) =>
  hashPhoneOtp(code) === expectedHash;
