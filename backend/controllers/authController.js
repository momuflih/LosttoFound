import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import nodemailer from "nodemailer";
import { checkPhoneVerification, generatePhoneOtp, hashPhoneOtp, normalizeIndianPhone, sendPhoneVerification } from "../utils/phoneVerification.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const adminEmails = () =>
  (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const makeToken = (user) =>
  jwt.sign({ userId: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

const safeUser = (user) => ({
  id: user._id,
  name: user.name,
  displayName: user.displayName || user.name,
  email: user.email,
  username: user.username || "",
  phoneVerified: user.phoneVerified,
  phone: user.phone || "",
  location: user.location || "",
  honorScore: user.honorScore,
  role: user.role,
  status: user.status || "",
  emailVerified: user.emailVerified,
  accountStatus: user.accountStatus,
});

const applyAdminRole = (user) => {
  if (adminEmails().includes(user.email.toLowerCase())) user.role = "admin";
};

export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: "Name, email and password are required." });
    }
    if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters long." });

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({ message: "An account with this email already exists." });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(password, 10),
      emailVerified: true,
      role: adminEmails().includes(normalizedEmail) ? "admin" : "user",
    });

    return res.status(201).json({
      message: "Account created successfully. You can now sign in.",
      user: safeUser(user),
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password) return res.status(400).json({ message: "Email and password are required." });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    applyAdminRole(user);
    if (user.accountStatus === "suspended") return res.status(403).json({ message: "This account is suspended." });
    await user.save();

    return res.status(200).json({ message: "Login successful.", token: makeToken(user), user: safeUser(user) });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

let mailer;

const getMailer = () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  if (mailer) return mailer;

  mailer = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
    requireTLS: Number(process.env.SMTP_PORT || 587) === 587,
    family: 4,
    pool: true,
    maxConnections: 2,
    maxMessages: 50,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 15000,
  });

  mailer.on("error", (error) => {
    console.error("SMTP connection error:", error.message);
  });

  return mailer;
};

const sendVerificationEmail = async (user, rawToken) => {
  const frontendUrl = (process.env.FRONTEND_URLS || "http://localhost:5173").split(",")[0].trim();
  const verifyUrl = `${frontendUrl}/verify-email?token=${encodeURIComponent(rawToken)}`;
  const mailer = getMailer();

  if (!mailer) {
    console.log("Email verification URL (SMTP not configured):", verifyUrl);
    return;
  }

  await mailer.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: user.email,
    subject: "Verify your LosttoFound email",
    text: `Verify your LosttoFound account using this link (expires in 30 minutes): ${verifyUrl}`,
    html: `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px;">
    <h2 style="color: #14532d;">Welcome to LosttoFound!</h2>

    <p>
      Thanks for signing up. Please verify your email address to continue.
    </p>

    <p style="margin: 30px 0;">
      <a
        href="${verifyUrl}"
        style="
          display: inline-block;
          padding: 12px 24px;
          background-color: #14532d;
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
        "
      >
        Verify Email
      </a>
    </p>

    <p>
      If the button doesn't work, copy and paste this link into your browser:
    </p>

    <p style="word-break: break-all;">
      ${verifyUrl}
    </p>

    <p>
      This verification link will expire in 30 minutes.
    </p>

    <p style="color: #666;">
      If you didn't create a LosttoFound account, you can safely ignore this email.
    </p>
  </div>
`,
  });
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Verification token is required." });

    const hashed = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      emailVerificationToken: hashed,
      emailVerificationExpires: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ message: "This verification link is invalid or expired." });

    user.emailVerified = true;
    user.emailVerificationToken = "";
    user.emailVerificationExpires = null;
    user.emailVerificationSentAt = null;
    await user.save();

    return res.status(200).json({ message: "Email verified successfully. You can now sign in." });
  } catch (error) {
    console.error("Verify email error:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

export const resendVerificationEmail = async (req, res) => {
  try {
    const normalizedEmail = String(req.body.email || "").toLowerCase().trim();
    if (!normalizedEmail) return res.status(400).json({ message: "Email is required." });

    const user = await User.findOne({ email: normalizedEmail });
    if (!user || user.authProvider !== "local" || user.emailVerified) {
      return res.status(200).json({ message: "If that account needs verification, a new verification email has been sent." });
    }

    if (user.emailVerificationSentAt && Date.now() - user.emailVerificationSentAt.getTime() < 60 * 1000) {
      return res.status(429).json({ message: "Please wait 60 seconds before requesting another verification email." });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.emailVerificationToken = crypto.createHash("sha256").update(verificationToken).digest("hex");
    user.emailVerificationExpires = Date.now() + 30 * 60 * 1000;
    user.emailVerificationSentAt = new Date();
    await user.save();
    await sendVerificationEmail(user, verificationToken);

    return res.status(200).json({ message: "If that account needs verification, a new verification email has been sent." });
  } catch (error) {
    console.error("Resend verification email error:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email?.trim()) return res.status(400).json({ message: "Email is required." });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    const generic = { message: "If an account with that email exists, a password reset link has been sent." };
    if (!user) return res.status(200).json(generic);

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    const frontendUrl = (process.env.FRONTEND_URLS || "http://localhost:5173").split(",")[0].trim();
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    const mailer = getMailer();

    if (mailer) {
      await mailer.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: user.email,
        subject: "LosttoFound password reset",
        text: `Reset your LosttoFound password using this link (expires in 15 minutes): ${resetUrl}`,
        html: `<p>Reset your LosttoFound password using this link. It expires in 15 minutes.</p><p><a href="${resetUrl}">Reset password</a></p>`,
      });
    } else {
      console.log("Password reset URL (SMTP not configured):", resetUrl);
    }

    return res.status(200).json(generic);
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;
    if (!token) return res.status(400).json({ message: "Reset token is required." });
    if (!newPassword || newPassword.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters long." });

    const hashed = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({ resetPasswordToken: hashed, resetPasswordExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ message: "Invalid or expired reset token." });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = "";
    user.resetPasswordExpires = null;
    await user.save();
    return res.status(200).json({ message: "Password reset successful." });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ message: "Google credential is required." });

    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) return res.status(401).json({ message: "Invalid Google account information." });

    const normalizedEmail = payload.email.toLowerCase().trim();
    let user = await User.findOne({ googleId: payload.sub }) || await User.findOne({ email: normalizedEmail });

    if (!user) {
      user = await User.create({
        name: payload.name || "Google User",
        email: normalizedEmail,
        password: await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10),
        googleId: payload.sub,
        authProvider: "google",
        emailVerified: true,
        role: adminEmails().includes(normalizedEmail) ? "admin" : "user",
      });
    } else {
      user.googleId ||= payload.sub;
      if (user.authProvider === "google" || user.googleId === payload.sub) user.emailVerified = true;
      applyAdminRole(user);
      if (user.accountStatus === "suspended") return res.status(403).json({ message: "This account is suspended." });
      await user.save();
    }

    return res.status(200).json({ message: "Google login successful.", token: makeToken(user), user: safeUser(user) });
  } catch (error) {
    console.error("Google login error:", error);
    return res.status(401).json({ message: "Google authentication failed." });
  }
};

export const sendOtp = async (req, res) => {
  try {
    const phone = normalizeIndianPhone(req.body.phone);
    if (!phone) return res.status(400).json({ message: "Enter a valid 10-digit Indian mobile number." });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (user.phoneVerified && user.phone === phone) {
      return res.status(200).json({ sent: false, verified: true, message: "This phone number is already verified." });
    }

    const now = Date.now();
    if (user.phoneOtpSentAt && user.phone === phone && now - user.phoneOtpSentAt.getTime() < 60 * 1000) {
      return res.status(429).json({ message: "Please wait 60 seconds before requesting another OTP." });
    }

    const code = generatePhoneOtp();
    const result = await sendPhoneVerification(phone, code);

    user.phone = phone;
    user.phoneVerified = false;
    user.phoneOtpHash = hashPhoneOtp(code);
    user.phoneOtpSentAt = new Date(now);
    user.phoneOtpExpires = new Date(now + 10 * 60 * 1000);
    await user.save();

    return res.status(200).json({ sent: true, status: result.status || "pending" });
  } catch (error) {
    console.error("Send OTP error:", error);
    return res.status(500).json({ message: "Unable to generate the verification OTP. Please try again." });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const code = String(req.body.code || "").replace(/\D/g, "");
    if (!/^\d{6}$/.test(code)) return res.status(400).json({ message: "Enter the 6-digit OTP." });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found." });
    if (!user.phone) return res.status(400).json({ message: "Request an OTP for your mobile number first." });
    if (!user.phoneOtpHash || !user.phoneOtpExpires || user.phoneOtpExpires.getTime() < Date.now()) {
      return res.status(400).json({ message: "The OTP has expired. Request a new OTP." });
    }

    if (!checkPhoneVerification(code, user.phoneOtpHash)) {
      return res.status(400).json({ message: "Incorrect or expired OTP." });
    }

    user.phoneVerified = true;
    user.phoneOtpHash = "";
    user.phoneOtpExpires = null;
    user.phoneOtpSentAt = null;
    await user.save();

    return res.status(200).json({ verified: true, user: safeUser(user) });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({ message: "Unable to verify the OTP right now. Please try again." });
  }
};
