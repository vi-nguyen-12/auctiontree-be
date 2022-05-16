const router = require("express").Router();
const { auth } = require("../middleware/verifyToken");
const {
  createFAQ,
  getAllFAQs,
  editFAQ,
  deleteFAQ,
} = require("../controller/faqController");

// should check if the user is admin
router.post("/", createFAQ);
router.get("/", getAllFAQs);
router.put("/:id", editFAQ);
router.delete("/:id", deleteFAQ);

module.exports = router;
