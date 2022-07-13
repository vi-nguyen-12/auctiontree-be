const mongoose = require("mongoose");

const PageContentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      enum: {
        values: [
          "team",
          "contact_us",
          "about_us",
          "TC_buying",
          "TC_selling",
          "TC_user",
          "terms_of_use",
          "privacy_policy",
          "US_cookie_policy",
          "international_cookie_policy",
          "disclaimer",
        ],
        message: "{VALUE} is not a valid name",
      },
    },
    htmlText: {
      type: String,
      required: true,
    },
    addressHtmlText: {
      type: String,
      required: function () {
        return this.name === "contact_us";
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PageContent", PageContentSchema);
