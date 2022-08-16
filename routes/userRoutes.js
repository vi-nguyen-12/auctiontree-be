const router = require("express").Router();
const { auth } = require("../middleware/verifyToken");
const {
  validateUser,
  validateUpdateUser,
} = require("../middleware/validateRequest");
const {
  registerUser,
  login,
  verify,
  getUserByBuyerId,
  getUserByPropertyId,
  checkJWT,
  resetForgotPassword,
  sendConfirmEmail,
  suspendUserAccount,
  deleteUserAccount,
  getLikedAuctions,
  setLikedAuction,
  setUnlikedAuction,
  getBidAuctionsOfBuyer,
  getAuctionsOfBuyer,
  getFundsOfBuyer,
  getWinAuctionsOfBuyer,
  getAuctionsOfSeller,
  getListingsOfSeller,
  editProfile,
  getAuctionsOfAllBuyersGroupedByUser,
  getPropertiesOfAllSellersGroupByUser,
  deleteNotification,
} = require("../controller/userController");

router.post("/register", validateUser, registerUser);
router.route("/login").post(login);
router.post("/confirmation/email", sendConfirmEmail);
router.post("/confirmation/verify", verify);
router.post("/checkJWT", checkJWT);
router.post("/password", resetForgotPassword);
router.put("/:id/:auctionId/liked", auth, setLikedAuction);
router.put("/:id/:auctionId/unliked", auth, setUnlikedAuction);
router.get("/:id/likes", auth, getLikedAuctions);
router.get("/:id/buyer/auctions/bid", auth, getBidAuctionsOfBuyer); //should authenticate user
router.get("/:id/buyer/auctions", auth, getAuctionsOfBuyer);
router.get("/:id/buyer/funds", auth, getFundsOfBuyer);
router.get("/:id/buyer/winAuctions", getWinAuctionsOfBuyer);
router.get("/seller/properties", getPropertiesOfAllSellersGroupByUser);
router.get("/buyer/auctions", getAuctionsOfAllBuyersGroupedByUser);
router.get("/:id/seller/auctions", getAuctionsOfSeller);
router.get("/:id/seller/properties", getListingsOfSeller);
//only for login user
router.put("/:id?suspended=true", auth, suspendUserAccount);
router.put("/:id?suspended=false", auth, suspendUserAccount);
router.delete(
  "/:userId/notifications/:notificationId",
  auth,
  deleteNotification
);
router.delete("/:id", auth, deleteUserAccount);
router.put("/:id", auth, validateUpdateUser, editProfile);
//only for admin
router.get("/buyerId/:buyerId", getUserByBuyerId);
router.get("/propertyId/:propertyId", getUserByPropertyId);
module.exports = router;
