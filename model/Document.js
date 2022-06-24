const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    officialName: {
      type: String,
      enum: {
        values: [
          "buying_agreement",
          "selling_agreement",
          "TC_buying",
          "TC_selling",
          "TC_user",
          "privacy_policy",
          "US_cookie_policy",
          "international_cookie_policy",
          "terms_of_use",
        ],
        message: "{VALUE} is not a valid official name",
      },
      required: true,
    },
    url: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);
