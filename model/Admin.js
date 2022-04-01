const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: Number, required: true },
  password: { type: String, required: true },
  location: { type: String, required: true },
  IPAddress: { type: String, required: true },
  role: {
    type: String,
    enum: [
      "general_admin",
      "regional_admin",
      "marketing_admin",
      "marketing_manager",
      "marketing_coordinator",
      "business_admin",
      "business_manager",
      "business_coordinator",
      "financial_admin",
      "financial_manager",
      "financial_coordinator",
      "legal_admin",
      "legal_manager",
      "legal_coordinator",
      "technical_admin",
      "technical_manager",
      "technical_coordinator",
      "escrow_agent",
    ],
    required: true,
  },
  department: {
    type: String,
    enum: [
      "administration",
      "business",
      "marketing",
      "financial",
      "legal",
      "technical",
    ],
    required: true,
  },
  image: { type: String },
  designation: { type: String },
  description: { type: String },
});

adminSchema.pre("save", function (next) {
  if (this.role === "super_admin" || this.role === "administrator") {
    this.department = "administration";
    next();
  }
  if (this.role === "business" || this.role === "marketing") {
    this.department = "marketing";
    next();
  }
  if (this.role === "financial") {
    this.department = "financial";
    next();
  }
  if (this.role === "legal") {
    this.department = "legal";
    next();
  }
  if (this.role === "technical") {
    this.department = "technical";
    next();
  }
  next(new Error("Invalid role for this department"));
});

module.exports = mongoose.model("Admin", adminSchema);
