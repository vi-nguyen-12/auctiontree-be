const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const buyerSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    auctionId: {
      type: Schema.Types.ObjectId,
      ref: "Auction",
      required: true,
    },
    answers: [
      {
        questionId: {
          type: Schema.Types.ObjectId,
          ref: "Question",
        },
        answer: { type: String, required: true, enum: ["yes", "no"] },
        explanation: String,
        files: [{ name: String, url: String }],
        isApproved: {
          type: Boolean,
          default: function () {
            if (this.answer === "no") {
              return true;
            } else {
              return false;
            }
          },
          required: true,
        },
      },
    ],
    documents: [
      {
        officialName: { type: String, required: true },
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
    TC: {
      time: { type: String, required: true },
      IPAddress: { type: String, required: true },
    },
    isApproved: {
      type: String,
      required: true,
      enum: ["pending", "success", "fail"],
      default: "pending",
    },
    rejectedReason: String,
  },
  { timestamp: true }
);
buyerSchema.pre("save", function (next) {
  let isAllAnsweredNo = true;
  for (let answer of this.answers) {
    if (answer.answer === "yes") {
      isAllAnsweredNo = false;
    }
  }
  if (isAllAnsweredNo) {
    this.isApproved = "success";
  }
  next();
});

module.exports = mongoose.model("Buyer", buyerSchema);
