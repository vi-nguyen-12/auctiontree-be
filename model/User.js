const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      trim: true,
      lowercase: true,
      required: [true, "First name is required"],
    },
    lastName: {
      type: String,
      trim: true,
      lowercase: true,
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
      // lowercase: true,
      required: [true, "User name is required"],
    },
    country: { type: String, trim: true },
    city: { type: String, trim: true },
    date: { type: Date, default: Date.now },
    agent: {
      // licenseNumber: { type: String, trim: true },
      // licenseDocument: {
      //   type: [
      //     {
      //       name: {
      //         type: String,
      //         required: function () {
      //           return this.licenseNumber?.length > 0;
      //         },
      //       },
      //       url: {
      //         type: String,
      //         required: function () {
      //           return this.licenseNumber?.length > 0;
      //         },
      //       },
      //       isVerified: {
      //         type: Boolean,
      //         required: function () {
      //           return this.licenseNumber?.length > 0;
      //         },
      //       },
      //     },
      //   ],
      // },
      // licenseState: {
      //   type: String,
      //   required: function () {
      //     return this.licenseNumber?.length > 0;
      //   },
      // },
      // licenseExpireDate: {
      //   type: Date,
      //   required: function () {
      //     return this.licenseNumber?.length > 0;
      //   },
      // },
      isApproved: {
        type: Boolean,
        default: false,
      },
      broker_licenses: {
        type: [
          {
            number: { type: String },
            expired_date: { type: String },
            state: { type: String },
            document: {
              name: {
                type: String,
                required: function () {
                  return this.number?.length > 0;
                },
              },
              url: {
                type: String,
                required: function () {
                  return this.number?.length > 0;
                },
              },
              isVerified: {
                type: Boolean,
                default: false,
              },
            },
          },
        ],
      },
    },
    secret: { type: Object },
    profileImage: String,
    description: String,
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
        propertyId: [{ type: Schema.Types.ObjectId, ref: "Property" }],
        auctionId: [{ type: Schema.Types.ObjectId, ref: "Auction" }],
        buyerId: [{ type: Schema.Types.ObjectId, ref: "Buyer" }],
        message: String,
        date: { type: Date, default: Date.now },
      },
    ],
    dueDiligence: [{ type: Schema.Types.ObjectId, ref: "Property" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

function deleteEmpty(v) {
  if (v === null || v === "") {
    return undefined;
  }
  return v;
}
