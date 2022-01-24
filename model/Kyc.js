const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const kycSchema = new mongoose.Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  kycId: { type: String, unique: true, required: true },
  status: { type: String, default: "PENDING" },
  result: { type: Object },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Kyc", kycSchema);
