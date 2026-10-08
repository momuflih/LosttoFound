import mongoose from "mongoose";

const notificationPrefsSchema = new mongoose.Schema(
  {
    newMatches: { type: Boolean, default: true },
    messages: { type: Boolean, default: true },
    itemUpdates: { type: Boolean, default: true },
    promotions: { type: Boolean, default: false },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    displayName: { type: String, default: "", trim: true, maxlength: 50 },
    username: {
      type: String,
      default: undefined,
      lowercase: true,
      trim: true,
      unique: true,
      sparse: true,
      minlength: 3,
      maxlength: 20,
      match: /^[a-z0-9_]*$/,
    },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    emailVerified: { type: Boolean, default: true },
    emailVerificationToken: { type: String, default: "" },
    emailVerificationExpires: { type: Date, default: null },
    emailVerificationSentAt: { type: Date, default: null },
    password: { type: String, required: true },
    resetPasswordToken: { type: String, default: "" },
    resetPasswordExpires: { type: Date, default: null },
    googleId: { type: String, default: undefined, unique: true, sparse: true },
    authProvider: { type: String, enum: ["local", "google"], default: "local" },
    phone: { type: String, default: "" },
    phoneVerified: { type: Boolean, default: false },
    phoneOtpHash: { type: String, default: "" },
    phoneOtpExpires: { type: Date, default: null },
    phoneOtpSentAt: { type: Date, default: null },
    location: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    status: { type: String, default: "", trim: true, maxlength: 80 },
    accountStatus: { type: String, enum: ["active", "suspended"], default: "active" },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    honorScore: { type: Number, default: 50, min: 0, max: 100 },
    stats: {
      itemsReturned: { type: Number, default: 0 },
      itemsFound: { type: Number, default: 0 },
      itemsLost: { type: Number, default: 0 },
    },
    notificationPrefs: { type: notificationPrefsSchema, default: () => ({}) },
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
