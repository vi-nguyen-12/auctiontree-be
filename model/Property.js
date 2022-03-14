const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const propertySchema = new Schema(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      required: true,
      enum: ["real-estate", "jet", "car", "yacht"],
    },
    details: { type: Object },
    images: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        isVerified: {
          type: String,
          required: true,
          enum: ["pending", "success", "fail"],
          default: "pending",
        },
      },
    ],
    videos: [
      {
        name: String,
        url: String,
        isVerified: {
          type: String,
          required: true,
          enum: ["pending", "success", "fail"],
          default: "pending",
        },
      },
    ],
    documents: [
      {
        officialName: {
          type: String,
          required: true,
        },
        name: { type: String, required: true },
        url: { type: String, required: true },
        isVerified: {
          type: String,
          required: true,
          enum: ["pending", "success", "fail"],
          default: "pending",
        },
      },
    ],
    docusignId: {
      type: Schema.Types.ObjectId,
      ref: "Docusign",
      required: true,
    },
    reservedAmount: { type: Number, required: true },
    discussedAmount: { type: Number, required: true },
    isApproved: {
      type: String,
      required: true,
      enum: ["pending", "success", "fail"],
      default: "pending",
    },
    rejectedReason: String,
  },
  { timestamps: true }
);
propertySchema.pre("save", function (next) {
  let requiredDocuments;
  switch (this.type) {
    case "real-estate":
      requiredDocuments = [
        "title_report",
        "insurance_copy",
        "financial_document",
        "purchase_agreement",
        "third-party_report",
        "demographics",
        "market_and_valuations",
      ];
      break;
    case "car":
      requiredDocuments = [
        "ownership_document",
        "registration_document",
        "title_certificate",
        "inspection_report",
        "engine_details",
        "insurance_document",
        "valuation_report",
      ];
      break;
    case "yacht":
      requiredDocuments = [
        "vessel_registration",
        "vessel_maintenance_report",
        "vessel_engine_type",
        "vessel_performance_report",
        "vessel_deck_details",
        "vessel_insurance",
        "vessel_marine_surveyor_report",
        "vessel_valuation_report",
      ];
      break;
    case "jet":
      requiredDocuments = [
        "ownership_document",
        "registration_document",
        "title_certificate",
        "detail_specification",
        "insurance_document",
        "jet_detail_history",
        "fitness_report",
        "electric_work_details",
        "engine_details",
        "inspection_report",
        "valuation_report",
      ];
      break;
  }
  for (item of requiredDocuments) {
    if (!this.documents.find((i) => i.officialName === item)) {
      next(new Error(`Document ${item} is required`));
    }
  }
  next();
});

module.exports = mongoose.model("Property", propertySchema);
