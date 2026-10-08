import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    targetType: { type: String, enum: ["user", "item", "message"], required: true },
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    targetItem: { type: mongoose.Schema.Types.ObjectId, ref: "Item", default: null },
    targetMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message", default: null },
    reason: { type: String, required: true, trim: true, maxlength: 200 },
    details: { type: String, trim: true, maxlength: 2000, default: "" },
    status: { type: String, enum: ["pending", "reviewed", "dismissed", "actioned"], default: "pending" },
    adminNotes: { type: String, trim: true, maxlength: 2000, default: "" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ targetUser: 1 });
reportSchema.index({ targetItem: 1 });
reportSchema.index({ reporter: 1, createdAt: -1 });

const Report = mongoose.model("Report", reportSchema);
export default Report;
