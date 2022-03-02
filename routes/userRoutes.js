const router = require("express").Router();
const { auth } = require("../middleware/verifyToken");
const { validateUser } = require("../middleware/validateRequest");
const {
  registerUser,
  login,
  logout,
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
  getBidAuctions,
  getApprovedAuctionsOfBuyer,
  getWinAuctionsOfBuyer,
  getApprovedAuctionsOfSeller,
  getPendingListingsOfSeller,
  getApprovedListingsOfSeller,
} = require("../controller/userController");

router.post("/register", validateUser, registerUser);
router.route("/login").post(login);
router.route("/logout").get(logout);
router.post("/confirmation/email", sendConfirmEmail);
router.post("/confirmation/verify", verify);
router.post("/checkJWT", checkJWT);
router.post("/password", resetForgotPassword);
router.put("/:id/likes/:auctionId", setLikedAuction);
router.delete("/:id/likes/:auctionId", setUnlikedAuction);
router.get("/:id/likes", getLikedAuctions);
router.get("/:id/bidAuctions", getBidAuctions);
router.get("/:id/buyer/approvedAuctions", getApprovedAuctionsOfBuyer);
router.get("/:id/buyer/winAuctions", getWinAuctionsOfBuyer);
router.get("/:id/seller/approvedAuctions", getApprovedAuctionsOfSeller);
router.get("/:id/seller/pendingListings", getPendingListingsOfSeller);
router.get("/:id/seller/approvedListings", getApprovedListingsOfSeller);
//only for login user
router.put("/:id?suspended=true", auth, suspendUserAccount);
router.put("/:id?suspended=false", auth, suspendUserAccount);
router.delete("/:id", auth, deleteUserAccount);
//only for admin
router.get("/buyerId/:buyerId", getUserByBuyerId);
router.get("/propertyId/:propertyId", getUserByPropertyId);

module.exports = router;
