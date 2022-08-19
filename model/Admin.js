const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  personalEmail: { type: String, required: true },
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
      "escrow",
    ],
    required: true,
  },
  permissions: [
    {
      type: String,
      enum: {
        values: [
          "admin_delete",
          "admin_edit",
          "admin_create",
          "admin_read",
          "auction_delete",
          "auction_edit",
          "auction_create",
          "auction_read",
          "auction_winner_edit",
          "auction_winner_read",
          "property_delete",
          "property_edit",
          "property_create",
          "property_read",
          "property_img_video_approval",
          "property_document_approval",
          "property_approval",
          "buyer_delete",
          "buyer_edit",
          "buyer_create",
          "buyer_read",
          "buyer_document_approval",
          "buyer_answer_approval",
          "buyer_approval",
        ],
        message: "Role {VALUE} is not supported",
      },
      required: true,
    },
  ],
  image: { type: String },
  designation: { type: String },
  description: { type: String },
  temp_token: { type: String },
});

adminSchema.pre("save", function (next) {
  if (
    (this.role === "general_admin" || this.role === "regional_admin") &&
    this.department == "administration"
  ) {
    next();
  }
  if (
    (this.role === "marketing_admin" ||
      this.role === "marketing_manager" ||
      this.role === "marketing_coordinator") &&
    this.department == "marketing"
  ) {
    next();
  }
  if (
    (this.role === "business_admin" ||
      this.role === "business_manager" ||
      this.role === "business_coordinator") &&
    this.department == "business"
  ) {
    next();
  }
  if (
    (this.role === "financial_admin" ||
      this.role === "financial_manager" ||
      this.role === "financial_coordinator") &&
    this.department == "financial"
  ) {
    next();
  }
  if (
    (this.role === "legal_admin" ||
      this.role === "legal_manager" ||
      this.role === "legal_coordinator") &&
    this.department == "legal"
  ) {
    next();
  }
  if (
    (this.role === "technical_admin" ||
      this.role === "technical_manager" ||
      this.role === "technical_coordinator") &&
    this.department == "technical"
  ) {
    next();
  }
  if (this.role === "escrow_agent" && this.department == "escrow") {
    next();
  }
  next(new Error(`${this.role} is not in ${this.department}`));
});

module.exports = mongoose.model("Admin", adminSchema);
