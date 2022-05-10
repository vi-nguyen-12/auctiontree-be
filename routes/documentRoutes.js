const router = require("express").Router();
const { auth } = require("../middleware/verifyToken");
const {
  createDocument,
  getDocuments,
  getDocument,
  editDocument,
  deleteDocument,
} = require("../controller/documentController");

// should check if the user is admin
router.post("/", createDocument);
router.put("/:id", editDocument);
router.delete("/:id", deleteDocument);
router.get("/:id", getDocument);
router.get("/", getDocuments);

module.exports = router;
