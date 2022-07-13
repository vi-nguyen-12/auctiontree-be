const router = require("express").Router();
const { auth } = require("../middleware/verifyToken");
const {
  getPageContents,
  createPageContent,
  editPageContent,
  deletePageContent,
} = require("../controller/pageContentController");

// should check if the user is admin
router.post("/", createPageContent);
router.get("/", getPageContents);
router.put("/:id", editPageContent);
router.delete("/:id", deletePageContent);

module.exports = router;
