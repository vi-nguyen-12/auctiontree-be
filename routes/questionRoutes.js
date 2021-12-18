const router = require("express").Router();
const { getQuestions } = require("../controller/questionController");

router.get("/", getQuestions);

module.exports = router;
