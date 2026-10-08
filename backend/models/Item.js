import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    itemKind: { type: String, enum: ["lost", "found"], required: true },
    itemType: { type: String, required: true, trim: true, maxlength: 50 },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 1000 },
    location: { type: String, required: true, trim: true, maxlength: 200 },
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 },
    date: { type: Date, required: true },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    contactVerified: { type: Boolean, default: false },
    verificationQuestions: [
      {
        question: { type: String, required: true, trim: true, maxlength: 200 },
        answer: { type: String, required: true, trim: true, maxlength: 300 },
      },
    ],
    status: { type: String, enum: ["open", "matched", "returned", "closed"], default: "open" },
    matchedWith: { type: mongoose.Schema.Types.ObjectId, ref: "Item", default: null },
    returnedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

itemSchema.index({ itemKind: 1, status: 1, date: -1 });
itemSchema.index({ reportedBy: 1 });
itemSchema.index({ lat: 1, lng: 1 });

const Item = mongoose.model("Item", itemSchema);
export default Item;
