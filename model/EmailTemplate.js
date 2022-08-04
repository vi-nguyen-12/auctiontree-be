const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const emailTemplateSchema = new Schema(
  {
    type: {
      type: String,
      enum: [
        "registration_confirm",
        "reset_password",
        "contact_us_reply",
        "partner_with_us_reply",
        "customer_id_docs_approval",
        "customer_id_docs_rejected",
        "POF_approval",
        "POF_rejected",
        "KYC",
        "KYC_complete",
        "KYC_incomplete",
        "stripe_payment",
        "property_registration",
        "property_payment",
        "property_approval",
        "property_rejected",
        "property_auction",
        "RM_to_auction",
        "property_sold_at_auction",
        "seller_missing_document",
        "settlement_between_seller_and_buyer",
        "final_settlement",
        "register_to_bid",
        "deposited_won_property",
        "buyer_missing_document",
        "highest_bidder_notification",
        "escrow",
        "settlement_fees_and_balance",
        "winner_of_auction",
      ],
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    replacedTexts: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

emailTemplateSchema.pre("save", function (next) {
  if (this.type == "registration_confirm") {
    this.replacedTexts = ["name", "customer_id"];
  }
  if (this.type == "reset_password") {
    this.replacedTexts = ["name", "link"];
  }
  if (this.type == "contact_us_reply") {
    this.replacedTexts = ["name"];
  }
  if (this.type == "partner_with_us_reply") {
    this.replacedTexts = ["name"];
  }
  if (this.type == "partner_with_us_reply") {
    this.replacedTexts = ["name"];
  }
  if (this.type == "customer_id_docs_rejected") {
    this.replacedTexts = ["link"];
  }
  if (this.type == "POF_approval") {
    this.replacedTexts = ["name", "document_name", "amount"];
  }
  if (this.type == "POF_rejected") {
    this.replacedTexts = ["name", "document_name"];
  }
  if (this.type == "KYC") {
    this.replacedTexts = ["name"];
  }
  if (this.type == "KYC_complete") {
    this.replacedTexts = ["name"];
  }
  if (this.type == "KYC_incomplete") {
    this.replacedTexts = ["name"];
  }
  if (this.type == "property_registration") {
    this.replacedTexts = ["name", "property_adddress"];
  }
  if (this.type == "property_payment") {
    this.replacedTexts = ["amount", "property_address"];
  }
  if (this.type == "property_approval") {
    this.replacedTexts = ["name", "property_address", "property_id"];
  }
  if (this.type == "property_rejected") {
    this.replacedTexts = [
      "name",
      "property_address",
      "property_id",
      "rejected_reason",
    ];
  }
  if (this.type == "property_auction") {
    this.replacedTexts = [
      "name",
      "property_address",
      "auction_id",
      "auction_registration_start_date",
      "auction_registration_end_date",
      "auction_start_date",
      "auction_end_date",
      "starting_bid_price",
      "increment_amount",
    ];
  }
  if (this.type == "RM_to_auction") {
    this.replacedTexts = ["auction_id", "admin_id", "admin_email"];
  }
  if (this.type == "property_sold_at_auction") {
    this.replacedTexts = [
      "name",
      "property_type",
      "property_address",
      "bid_amount",
    ];
  }
  if (this.type == "seller_missing_document") {
    this.replacedTexts = ["name"];
  }
  if (this.type == "settlement_between_seller_and_buyer") {
    this.replacedTexts = ["seller_name", "buyer_name", "property_address"];
  }
  if (this.type == "final_settlement") {
    this.replacedTexts = ["property_type", "property_address"];
  }
  if (this.type == "register_to_bid") {
    this.replacedTexts = [
      "name",
      "auction_id",
      "property_type",
      "property_address",
    ];
  }
  if (this.type == "deposited_won_property") {
    this.replacedTexts = ["amount", "property_type", "property_address"];
  }
  if (this.type == "buyer_missing_document") {
    this.replacedTexts = ["name"];
  }

  if (this.type == "highest_bidder_notification") {
    this.replacedTexts = ["name", "auction_id", "bidding_amount"];
  }
  if (this.type == "escrow") {
    this.replacedTexts = ["name", "auction_id"];
  }
  if (this.type == "settlement_fees_and_balance") {
    this.replacedTexts = [
      "name",
      "property_type",
      "property_address",
      "closing_fee",
    ];
  }
  if (this.type == "winner_of_auction") {
    this.replacedTexts = ["name", "property_type", "property_address"];
  }
  for (let i of this.replacedTexts) {
    if (!this.content.includes(`[${i}###]`)) {
      next(new Error(`[${i}###] is missing in email template`));
    }
  }
  next();
});

module.exports = mongoose.model("EmailTemplate", emailTemplateSchema);
