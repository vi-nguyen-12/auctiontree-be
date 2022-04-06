const router = require("express").Router();
const { auth } = require("../middleware/verifyToken");
const { validateBuyer } = require("../middleware/validateRequest");
const { checkKyc } = require("../middleware/checkKyc");
const {
  createBuyer,
  editBuyer,
  approveBuyer,
  verifyDocument,
  getBuyers,
  approveAnswer,
  deleteBuyer,
} = require("../controller/buyerController");

router.post("/", auth, checkKyc, validateBuyer, createBuyer);
router.put("/:id", auth, editBuyer);
router.put("/:buyerId/documents/:documentId/status", auth, verifyDocument);
router.put("/:buyerId/answers/:questionId/approved", auth, approveAnswer);
router.put("/:id/status", auth, approveBuyer);
router.get("/", auth, getBuyers);
router.delete("/:id", auth, deleteBuyer);
module.exports = router;
