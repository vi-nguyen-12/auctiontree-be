const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const propertySchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["real-estate", "jet", "car", "yacht"],
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    //   details: {tyoe: Object} details of property: key-value
    // files:{type: Object} array of locations in S3
  },
  { timestamp: true }
);

module.exports = mongoose.model("Property", propertySchema);
