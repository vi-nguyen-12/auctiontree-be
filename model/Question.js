const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const questionSchema = new Schema({
  questionType: { type: String, required: true, default: "YESNO" },
  questionText: { type: String, required: true },
  answers: [{ text: String }],
});

module.exports = mongoose.model("Question", questionSchema);
