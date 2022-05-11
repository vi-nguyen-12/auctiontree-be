const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  email: { type: String, required: [true, "Email is required"] },
});

module.exports = mongoose.model("Subscription", subscriptionSchema);
