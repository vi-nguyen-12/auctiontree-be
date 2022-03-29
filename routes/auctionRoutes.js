const router = require("express").Router();
const { auth } = require("../middleware/verifyToken");
const { validateAuction } = require("../middleware/validateRequest");

const {
  createAuction,
  getAuction,
  editAuction,
  placeBidding,
  getUpcomingAuctions,
  getOngoingAuctions,
  getUpcomingAuctionsOfSpecificType,
  getOngoingAuctionsOfSpecificType,
  getRealEstateAuctionsStatusBuyer,
  getAuctionResult,
  deleteAuction,
} = require("../controller/auctionController");

// need to check if the user is admin
router.post("/", validateAuction, createAuction);
router.put("/bidding/:id", auth, placeBidding);
router.get("/upcoming", getUpcomingAuctions);
router.get("/ongoing", getOngoingAuctions);
router.get("/real-estate/upcoming", getUpcomingAuctionsOfSpecificType);
router.get("/real-estate/ongoing", getOngoingAuctionsOfSpecificType);
router.get("/car/upcoming", getUpcomingAuctionsOfSpecificType);
router.get("/car/ongoing", getOngoingAuctionsOfSpecificType);
router.get("/yacht/upcoming", getUpcomingAuctionsOfSpecificType);
router.get("/yacht/ongoing", getOngoingAuctionsOfSpecificType);
router.get("/jet/upcoming", getUpcomingAuctionsOfSpecificType);
router.get("/jet/ongoing", getOngoingAuctionsOfSpecificType);
router.get("/status", auth, getRealEstateAuctionsStatusBuyer);
router.get("/result/:id", getAuctionResult);
router.get("/propertyId/:propertyId", getAuction);
router.get("/:id", getAuction);
router.put("/:id", editAuction);
router.delete("/:id", deleteAuction);

module.exports = router;
