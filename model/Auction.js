const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const auctionSchema = new Schema(
  {
    property: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: [true, "Property is required"],
    },
    startingBid: { type: Number, required: [true, "Starting bid is required"] },
    incrementAmount: {
      type: Number,
      required: [true, "Increment amount is required"],
    },
    registerStartDate: {
      type: Date,
      required: [true, "Register start date is required"],
    },
    registerEndDate: {
      type: Date,
      required: [true, "Register end date is required"],
    },
    auctionStartDate: {
      type: Date,
      required: [true, "Auction start date is required"],
    },
    auctionEndDate: {
      type: Date,
      required: [true, "Auction end date is required"],
    },
    bids: [
      {
        buyerId: {
          type: Schema.Types.ObjectId,
          ref: "Buyer",
          required: true,
        },
        amount: Number,
        time: Date,
      },
    ],
    winner: {
      buyerId: { type: Schema.Types.ObjectId, ref: "Buyer" },
      amount: Number,
      time: { type: Date, default: new Date() },
    },
    isFeatured: { type: Boolean, default: false, required: true },
    isActive: { type: Boolean, default: true, required: true },
    viewCounts: { type: Number, default: 0, required: true },
    reviews: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        content: { type: String },
        star: { type: Number, min: 1, max: 5 },
      },
    ],
  },
  { timestamp: true }
);

module.exports = mongoose.model("Auction", auctionSchema);
