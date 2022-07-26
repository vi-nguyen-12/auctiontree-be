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
        explanation: {
          type: String,
          required: function () {
            return this.answer === "yes";
          },
        },
        files: {
          type: [{ name: String, url: String }],
          required: function () {
            return this.answer === "yes";
          },
        },
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
    funds: [
      {
        document: {
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
          url: {
            type: String,
            required: [true, "Url of document is required"],
          },
          validity: String,
          isSelf: {
            type: Boolean,
            require: [true, "isSelf of document is required"],
          },
          providerName: {
            type: String,
            required: [
              function () {
                return this.isSelf === false;
              },
              "providerName is required",
            ],
          },
          isVerified: {
            type: String,
            required: true,
            enum: ["pending", "success", "fail"],
            default: "pending",
          },
        },
        amount: {
          type: Number,
          default: 0,
          min: [0, "Fund amount must be greater than 0"],
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
    availableFund: { type: Number, required: true, default: 0 },
    // rejectedReason: String,
  },

  { timestamp: true }
);

module.exports = mongoose.model("Buyer", buyerSchema);
