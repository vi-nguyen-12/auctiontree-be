const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
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
  },
  status: {
    type: String,
    required: true,
    enum: {
      values: ["activated", "deactivated"],
    },
    default: "activated",
  },
});

module.exports = mongoose.model("Permission", permissionSchema);
