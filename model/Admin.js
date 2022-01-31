const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: Number, required: true },
  password: { type: String, required: true },
  country: { type: String },
  city: { type: String },
  position: { type: String, required: true },
  department: { type: String, required: true },
});

module.exports = mongoose.model("Admin", adminSchema);
