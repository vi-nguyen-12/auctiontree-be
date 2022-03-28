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
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        amount: Number,
        time: Date,
      },
    ],
    winner: {
      userId: { type: Schema.Types.ObjectId, ref: "User" },
      amount: Number,
    },
  },
  { timestamp: true }
);

module.exports = mongoose.model("Auction", auctionSchema);
