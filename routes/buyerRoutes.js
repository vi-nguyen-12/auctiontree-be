const router = require("express").Router();
const { auth } = require("../middleware/verifyToken");
const { checkKyc } = require("../middleware/checkKyc");
const {
  createBuyer,
  approveBuyer,
  disapproveBuyer,
  verifyDocument,
  getBuyers,
  getApprovedBuyers,
  getNotApprovedBuyers,
} = require("../controller/buyerController");

router.post("/", auth, checkKyc, createBuyer);

//this should be only for admin
router.put("/:buyerId/documents/:documentId/status", verifyDocument);
router.put("/:id/approved", approveBuyer);
router.put("/:id/disapproved", disapproveBuyer);
router.get("/", getBuyers);
router.get("/approved", getApprovedBuyers);
router.get("/notApproved", getNotApprovedBuyers);
module.exports = router;
