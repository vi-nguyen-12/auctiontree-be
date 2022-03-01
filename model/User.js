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
  isActive: { type: Boolean, required: true, default: false },
  KYC: { type: Boolean, required: true, default: false },
  temp_token: String,
  isSuspended: { type: Boolean, required: true, default: false },
  likedAuctions: [{ type: Schema.Types.ObjectId, ref: "Auction" }],
});

module.exports = mongoose.model("User", userSchema);
