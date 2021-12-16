const router = require("express").Router();
const { auth } = require("../middleware/verifyToken");
const { checkKyc } = require("../middleware/checkKyc");
const {
  createAuction,
  getCurrentAuction,
  placeBidding,
} = require("../controller/auctionController");

// need to check if the user is admin
router.post("/", createAuction);

router.put("/bidding/:id", auth, checkKyc, placeBidding);
router.get("/:id", getCurrentAuction);
module.exports = router;