const router = require("express").Router();
const {
  getQuestions,
  createQuestion,
} = require("../controller/questionController");

router.get("/", getQuestions);
router.post("/", createQuestion);

module.exports = router;
