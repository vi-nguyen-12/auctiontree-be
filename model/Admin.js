const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const adminSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  personalEmail: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: Number },
  password: { type: String, required: true },
  location: { type: String },
  IPAddress: { type: String },
  role: {
    type: Schema.Types.ObjectId,
    ref: "Role",
    required: [true, "Role is required"],
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

module.exports = mongoose.model("Admin", adminSchema);
