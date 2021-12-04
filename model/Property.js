const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const documentSchema = new Schema({
  // name: { type: String, required: true },
  name: String,
  isVerified: {
    type: String,
    required: true,
    enum: ["pending", "success", "fail"],
    default: "pending",
  },
  details: Object,
});

const propertySchema = new Schema(
  {
    // createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdBy: String,
    type: {
      type: String,
      required: true,
      enum: ["real-estate", "jet", "car", "yacht"],
    },
    details: { type: Object },
    images: Array,
    videos: Array,
    documents: [documentSchema],
  },
  { timestamp: true }
);

module.exports = mongoose.model("Property", propertySchema);
module.exports = mongoose.model("Document", documentSchema);
