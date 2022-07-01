const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    officialName: {
      type: String,
      enum: {
        values: [
          "buying_agreement",
          "selling_agreement",
          "TC_buying",
          "TC_selling",
          "TC_user",
          "terms_of_use",
          "privacy_policy",
          "US_cookie_policy",
          "international_cookie_policy",
        ],
        message: "{VALUE} is not a valid official name",
      },
      required: true,
    },
    url: {
      type: String,
    },
    htmlText: {
      type: String,
    },
  },
  { timestamps: true }
);
documentSchema.pre("save", function (next) {
  if (
    this.officialNameName == "buying_agreement" ||
    this.officialNameName == "selling_agreement"
  ) {
    if (!this.name || !this.url) {
      next(new Error("Name of document or url is required "));
    }
  } else {
    if (this.name || this.url) {
      next(new Error("Name of document or url is not allowed "));
    }
    if (!this.htmlText) {
      next(new Error("htmlText is required"));
    }
  }
  next();
});

module.exports = mongoose.model("Document", documentSchema);
