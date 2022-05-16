const FAQ = require("../model/FAQ");

// @desc  Create an FAQ
// @route POST /api/faqs   body:{question, answer}
const createFAQ = async (req, res) => {
  try {
    const { question, answer } = req.body;
    const faq = new FAQ({ question, answer });
    const newFAQ = await faq.save();
    return res.status(200).send(newFAQ);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// @desc  Get all FAQs
// @route GET /api/faqs
const getAllFAQs = async (req, res) => {
  try {
    const faqs = await FAQ.find();
    return res.status(200).send(faqs);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// @desc  Edit an FAQ
// @route PUT /api/faqs/:id  body:{question, answer}
const editFAQ = async (req, res) => {
  try {
    const { question, answer } = req.body;
    const faq = await FAQ.findById(req.params.id);
    if (!faq) {
      return res.status(200).send({ error: "FAQ not found" });
    }
    faq.question = question;
    faq.answer = answer;
    const newFaq = await faq.save();
    res.status(200).send(newFaq);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// @desc  Delete an FAQ
// @route DELETE /api/faqs/:id
const deleteFAQ = async (req, res) => {
  try {
    await FAQ.deleteOne({ _id: req.params.id });
    res.status(200).send({ message: "FAQ deleted successfully" });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

module.exports = { createFAQ, getAllFAQs, editFAQ, deleteFAQ };
