const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: [true, "First name is required"] },
  lastName: { type: String, required: [true, "Last name is required"] },
  email: { type: String, required: [true, "Email is required"] },
  phone: { type: String, required: [true, "Phone is required"] },
  password: { type: String, required: [true, "Password is required"] },
  userName: { type: String, required: [true, "User name is required"] },
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
  wallet: {
    type: Number,
    default: 0,
    min: [0, "Wallet must be greater than 0"],
  },
});

module.exports = mongoose.model("User", userSchema);

function deleteEmpty(v) {
  if (v === null || v === "") {
    return undefined;
  }
  return v;
}
