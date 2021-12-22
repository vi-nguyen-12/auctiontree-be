const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const buyerSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    answers: [
      {
        questionId: {
          type: Schema.Types.ObjectId,
          ref: "Question",
        },
        answer: { type: String, required: true, enum: ["yes", "no"] },
      },
    ],
    documents: [
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
    docusign: {
      name: String,
      url: String,
      isSigned: { type: Boolean, default: false },
    },
    TC: {
      time: { type: String, required: true },
      IPAddress: { type: String, required: true },
    },
    isApproved: { type: Boolean, default: false },
  },
  { timestamp: true }
);

module.exports = mongoose.model("Buyer", buyerSchema);
