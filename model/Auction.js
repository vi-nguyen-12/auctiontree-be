const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const auctionSchema = new Schema(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    startingBid: { type: Number, required: true },
    incrementAmount: { type: Number, required: true },
    registerStartDate: { type: Date, required: true },
    registerEndDate: { type: Date, required: true },
    auctionStartDate: { type: Date, required: true },
    auctionEndDate: { type: Date, required: true },
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
