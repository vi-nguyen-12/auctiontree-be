const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const teamSchema = new mongoose.Schema({
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
  department: {
    type: String,
    required: true,
    enum: [
      "operation",
      "founder",
      "research",
      "marketing",
      "technology",
      "business",
      "legal",
    ],
  },
  linkedln: { type: String },
  location: {
    city: { type: String, required: [true, "City is required"] },
    country: { type: String, required: [true, "Country is required"] },
    state: { type: String, required: [true, "State is required"] },
  },
  profileImage: String,
});

module.exports = mongoose.model("Team", teamSchema);
