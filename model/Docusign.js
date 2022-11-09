const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const docusignSchema = new Schema(
  {
    envelopeId: { type: String, required: true },
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: {
      type: String,
      enum: ["selling_agreement", "buying_agreement"],
      required: true,
    },
    recipients: {
      type: [
        {
          type: { type: String, enum: ["signer1", "signer2", "cc1", "cc2"] },
          name: { type: String, required: true },
          email: { type: String, required: true },
          recipientId: { type: String, required: true },
          clientUserId: { type: String, required: true },
        },
      ],
    },
    status: {
      type: String,
      enum: [
        "pending",
        "signing_complete",
        "viewing_complete",
        "decline",
        "cancel",
      ],
      default: "pending",
    },
  },
  { timestamp: true }
);

module.exports = mongoose.model("Docusign", docusignSchema);
