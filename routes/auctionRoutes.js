const router = require("express").Router();
const { auth, authNotStrict } = require("../middleware/verifyToken");
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
router.post("/", auth, validateAuction, createAuction);
router.put("/bidding/:id", auth, placeBidding);
router.get("/upcoming/:type", getUpcomingAuctions);
router.get("/ongoing/:type", getOngoingAuctions);
router.get("/upcoming", getUpcomingAuctions);
router.get("/ongoing", getOngoingAuctions);
// router.get("/real-estate/upcoming", getUpcomingAuctionsOfSpecificType);
// router.get("/real-estate/ongoing", getOngoingAuctionsOfSpecificType);
// router.get("/car/upcoming", getUpcomingAuctionsOfSpecificType);
// router.get("/car/ongoing", getOngoingAuctionsOfSpecificType);
// router.get("/yacht/upcoming", getUpcomingAuctionsOfSpecificType);
// router.get("/yacht/ongoing", getOngoingAuctionsOfSpecificType);
// router.get("/jet/upcoming", getUpcomingAuctionsOfSpecificType);
// router.get("/jet/ongoing", getOngoingAuctionsOfSpecificType);
router.get("/status", auth, getRealEstateAuctionsStatusBuyer);
router.get("/result/:id", getAuctionResult);
router.get("/propertyId/:propertyId", getAuction);
router.get("/:id", authNotStrict, getAuction); // no need for user to log in
router.put("/:id", auth, editAuction);
router.delete("/:id", auth, deleteAuction);
module.exports = router;
