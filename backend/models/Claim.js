import mongoose from "mongoose";

const claimSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
    claimant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    answers: [
      {
        question: { type: String, required: true, trim: true, maxlength: 200 },
        answer: { type: String, required: true, trim: true, maxlength: 300 },
      },
    ],
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

claimSchema.index({ item: 1 });
claimSchema.index({ claimant: 1 });
claimSchema.index({ item: 1, claimant: 1 }, { unique: true });

const Claim = mongoose.model("Claim", claimSchema);
export default Claim;
