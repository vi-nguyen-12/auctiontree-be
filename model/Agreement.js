const mongoose = require("mongoose");

const agreementSchema = new mongoose.Schema({
  officialName: {
    type: String,
    required: true,
    enum: ["selling_agreement", "buying_agreement"],
  },
  name: { type: String, required: true },
  url: { type: String, required: true },
});

module.exports = mongoose.model("Agreement", agreementSchema);
