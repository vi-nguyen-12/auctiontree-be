const router = require("express").Router();
const { auth } = require("../middleware/verifyToken");
const { checkKyc } = require("../middleware/checkKyc");
const {
  createBuyer,
  approveBuyer,
  verifyDocument,
  getBuyers,
} = require("../controller/buyerController");

router.post("/", auth, checkKyc, createBuyer);

//this should be only for admin
router.put("/:buyerId/documents/:documentId/status", verifyDocument);
router.put("/:id/status", approveBuyer);
router.get("/", getBuyers);
module.exports = router;
