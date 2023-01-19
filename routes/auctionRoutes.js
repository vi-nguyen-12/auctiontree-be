const router = require("express").Router();
const { auth, authUser, authNotStrict } = require("../middleware/verifyToken");
const { validateAuction } = require("../middleware/validateRequest");

const {
  createAuction,
  getAuction,
  editAuction,
  placeBidding,
  getUpcomingAuctions,
  getOngoingAuctions,
  getAuctionStatusOfABuyer,
  getAuctionResult,
  deleteAuction,
  getAuctions,
  setWinner,
  getAuctionCount,
  createReview,
  editReview,
  deleteReview,
} = require("../controller/auctionController");

router.get("/upcoming/:type", getUpcomingAuctions);
router.get("/ongoing/:type", getOngoingAuctions);
router.get("/upcoming", getUpcomingAuctions);
router.get("/ongoing", getOngoingAuctions);
router.get("/status", auth, getAuctionStatusOfABuyer);
router.get("/real-estate/counts", getAuctionCount);

router.post("/", auth, validateAuction, createAuction);
router.get("/propertyId/:propertyId", authNotStrict, getAuction);
router.get("/:id/result", getAuctionResult);
router.get("/:id", authNotStrict, getAuction);
router.get("/", authNotStrict, getAuctions);
router.put("/bidding/:id", auth, placeBidding);
router.put("/:id/winner", authNotStrict, setWinner);
router.put("/:auctionId/reviews/:reviewId", authUser, editReview);
router.put("/:id/reviews", authUser, createReview);
router.delete("/:auctionId/reviews/:reviewId", authUser, deleteReview);
router.put("/:id", auth, editAuction);
router.delete("/:id", auth, deleteAuction);
module.exports = router;
