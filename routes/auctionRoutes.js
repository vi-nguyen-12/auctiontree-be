const router = require("express").Router();
const { auth } = require("../middleware/verifyToken");
const { checkKyc } = require("../middleware/checkKyc");
const {
  createAuction,
  getAuction,
  placeBidding,
} = require("../controller/auctionController");

// need to check if the user is admin
router.post("/", createAuction);
router.put("/bidding/:id", auth, placeBidding);
router.get("/propertyId/:propertyId", getAuction);
router.get("/:id", getAuction);

module.exports = router;
