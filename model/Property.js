const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const propertySchema = new Schema(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      required: true,
      enum: ["real-estate", "jet", "car", "yacht"],
    },
    details: { type: Object },
    images: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        isVerified: {
          type: String,
          required: true,
          enum: ["pending", "success", "fail"],
          default: "pending",
        },
      },
    ],
    videos: [
      {
        name: String,
        url: String,
        isVerified: {
          type: String,
          required: true,
          enum: ["pending", "success", "fail"],
          default: "pending",
        },
      },
    ],
    documents: [
      {
        officialName: {
          type: String,
          required: true,
          enum: [
            "title_report",
            "insurance_copy",
            "financial_document",
            "purchase_agreement",
            "third-party_report",
            "demographics",
            "market_and_valuations",
          ],
        },
        name: { type: String, required: true },
        url: { type: String, required: true },
        isVerified: {
          type: String,
          required: true,
          enum: ["pending", "success", "fail"],
          default: "pending",
        },
      },
    ],
    docusignId: {
      type: Schema.Types.ObjectId,
      ref: "Docusign",
      required: true,
    },
    reservedAmount: { type: Number, required: true },
    discussedAmount: { type: Number, required: true },
    isApproved: {
      type: String,
      required: true,
      enum: ["pending", "success", "fail"],
      default: "pending",
    },
    rejectedReason: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Property", propertySchema);
