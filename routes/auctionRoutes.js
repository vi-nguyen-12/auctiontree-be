const router = require("express").Router();
const { auth } = require("../middleware/verifyToken");
const { checkKyc } = require("../middleware/checkKyc");
const {
  createAuction,
  getAuction,
  editAuction,
  placeBidding,
  getUpcomingAuctionsOfRealEstates,
  getOngoingAuctionsOfRealEstates,
  getRealEstateAuctionsStatusBuyer,
  getAuctionResult,
  deleteAuction,
} = require("../controller/auctionController");

// need to check if the user is admin
router.post("/", createAuction);
router.put("/bidding/:id", auth, placeBidding);
router.get("/real-estates/upcoming", getUpcomingAuctionsOfRealEstates);
router.get("/real-estates/ongoing", getOngoingAuctionsOfRealEstates);
router.get("/real-estates/status", auth, getRealEstateAuctionsStatusBuyer);
router.get("/result/:id", getAuctionResult);
router.get("/propertyId/:propertyId", getAuction);
router.get("/:id", getAuction);
router.put("/:id", editAuction);
router.delete("/:id", deleteAuction);

module.exports = router;
