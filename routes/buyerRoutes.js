const router = require("express").Router();
const { auth } = require("../middleware/verifyToken");
const { validateBuyer } = require("../middleware/validateRequest");
const { checkKyc } = require("../middleware/checkKyc");
const {
  createBuyer,
  approveFund,
  addFund,
  editBuyer,
  // verifyDocument,
  getBuyers,
  approveAnswer,
  disapproveAnswer,
  deleteBuyer,
} = require("../controller/buyerController");

router.post("/", auth, checkKyc, validateBuyer, createBuyer);
router.put("/:id/funds/addition", auth, addFund);
router.put("/:buyerId/funds/:fundId", auth, approveFund);
router.put("/:id", auth, editBuyer);
router.put("/:buyerId/answers/:questionId/approved", auth, approveAnswer);
router.put("/:buyerId/answers/:questionId/disapproved", auth, disapproveAnswer);
router.get("/", auth, getBuyers);
router.delete("/:id", auth, deleteBuyer);
module.exports = router;
