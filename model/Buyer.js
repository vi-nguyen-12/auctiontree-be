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
        officialName: {
          type: String,
          required: true,
          enum: {
            values: [
              "bank_statement",
              "brokerage_account_statement",
              "crypto_account_statement",
              "line_of_credit_doc",
            ],
            message: "Document with official name {VALUE} is not a supported",
          },
        },
        name: {
          type: String,
          required: [true, "Name of document is required"],
        },
        url: { type: String, required: [true, "Url of document is required"] },
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
    approvedFund: { type: Number, min: [0, "Fund must be greater than 0"] },
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
