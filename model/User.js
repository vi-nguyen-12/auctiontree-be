const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    trim: true,
    required: [true, "First name is required"],
  },
  lastName: {
    type: String,
    trim: true,
    required: [true, "Last name is required"],
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    required: [true, "Email is required"],
  },
  phone: { type: String, required: [true, "Phone is required"] },
  password: { type: String, required: [true, "Password is required"] },
  userName: {
    type: String,
    trim: true,
    lowercase: true,
    required: [true, "User name is required"],
  },
  country: { type: String, trim: true },
  city: { type: String, trim: true },
  date: { type: Date, default: Date.now },
  agent: {
    licenseNumber: { type: String, trim: true },
    licenseDocument: {
      type: [
        {
          name: {
            type: String,
            required: function () {
              return this.licenseNumber?.length > 0;
            },
          },
          url: {
            type: String,
            required: function () {
              return this.licenseNumber?.length > 0;
            },
          },
        },
      ],
    },
  },
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
  notifications: [
    {
      message: String,
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
