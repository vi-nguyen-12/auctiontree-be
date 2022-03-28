const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const docusignSchema = new Schema(
  {
    envelopeId: { type: String, required: true },
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["seller_agreement", "buying_agreement"],
      required: true,
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
