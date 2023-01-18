const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const allowedToSellCountrySchema = new mongoose.Schema({
  name: { type: String, required: true },
  isAllowed: { type: Boolean, required: true, default: true },
});

module.exports = mongoose.model(
  "allowedToSellCountry",
  allowedToSellCountrySchema
);
