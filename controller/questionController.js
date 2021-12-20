const Question = require("../model/Question");

//@desc  Get all questions
//@route GET /api/questions
const getQuestions = async (req, res) => {
  try {
    const questions = await Question.find({});
    res.status(200).send(questions);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

////@desc  Create a question
//@route POST admin/api/questions body={question}
const createQuestion = async (req, res) => {
  const { question: questionText } = req.body;
  try {
    const newQuestion = new Question({ questionText });
    const savedQuestion = await newQuestion.save();
    res.status(200).send({
      _id: savedQuestion._id,
      questionType: savedQuestion.questionType,
      questionText: savedQuestion.questionText,
    });
  } catch (err) {
    res.status(500).send(err);
  }
};

module.exports = { getQuestions, createQuestion };
