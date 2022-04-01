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
} = require("../controller/buyerController");

router.post("/", auth, checkKyc, validateBuyer, createBuyer);
router.put("/:id", auth, editBuyer);

//this should be only for admin
router.put("/:buyerId/documents/:documentId/status", verifyDocument);
router.put("/:buyerId/answers/:questionId/approved", approveAnswer);
router.put("/:id/status", approveBuyer);
router.get("/", getBuyers);
module.exports = router;
