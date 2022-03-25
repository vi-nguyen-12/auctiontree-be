const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  userName: { type: String, required: true },
  country: { type: String },
  city: { type: String },
  date: { type: Date, default: Date.now },
  secret: { type: Object },
  profileImage: String,
  isActive: { type: Boolean, required: true, default: false },
  KYC: { type: Boolean, required: true, default: true },
  temp_token: String,
  isSuspended: { type: Boolean, required: true, default: false },
  likedAuctions: [{ type: Schema.Types.ObjectId, ref: "Auction" }],
  social_links: {
    facebook: { type: String, set: deleteEmpty },
    instagram: { type: String, set: deleteEmpty },
    twitter: { type: String, set: deleteEmpty },
  },
  wallet: { type: Number, default: 0 },
  financialDocuments: [
    {
      officialName: {
        type: String,
        required: true,
        enum: [
          "bank_statement",
          "brokerage_account_statement",
          "crypto_account_statement",
          "line_of_credit_doc",
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
});

module.exports = mongoose.model("User", userSchema);

function deleteEmpty(v) {
  if (v === null || v === "") {
    return undefined;
  }
  return v;
}
