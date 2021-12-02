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
    //   details: {type: Object} details of property: key-value
    // images:array of locations in S3
    //videos: array of locations in S3
    // documents: [{name, location, verified}]
  },
  { timestamp: true }
);

module.exports = mongoose.model("Property", propertySchema);
