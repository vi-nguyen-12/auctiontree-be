const router = require("express").Router();
const {
  auth,
  authUser,
  authNotStrict,
  authAdmin,
} = require("../middleware/verifyToken");
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
  getAllUsers,
} = require("../controller/userController");

router.post("/register", authNotStrict, validateUser, registerUser);
router.route("/login").post(login);
router.post("/confirmation/email", sendConfirmEmail);
router.post("/confirmation/verify", verify);
router.post("/checkJWT", checkJWT);
router.post("/password", resetForgotPassword);
router.put("/:id/:auctionId/liked", auth, setLikedAuction);
router.put("/:id/:auctionId/unliked", auth, setUnlikedAuction);
router.get("/:id/likes", auth, getLikedAuctions);
router.get("/:id/buyer/auctions/bid", authUser, getBidAuctionsOfBuyer);
router.get("/:id/buyer/auctions", auth, getAuctionsOfBuyer);
router.get("/:id/buyer/funds", auth, getFundsOfBuyer);
router.get("/:id/buyer/winAuctions", getWinAuctionsOfBuyer);
router.get("/seller/properties",authAdmin, getPropertiesOfAllSellersGroupByUser);
router.get("/buyer/auctions", getAuctionsOfAllBuyersGroupedByUser);
router.get("/:id/seller/auctions", getAuctionsOfSeller);
router.get("/:id/seller/properties",authAdmin, getListingsOfSeller);
router.get("/", authAdmin, getAllUsers);
//only for login user
router.put("/:id/suspended", auth, suspendUserAccount);
router.delete(
  "/:userId/notifications/:notificationId",
  auth,
  deleteNotification
);
router.delete("/:id/delete", auth, deleteUserAccount);
router.put("/:id/edit", auth, validateUpdateUser, editProfile);
//only for admin
router.get("/buyerId/:buyerId", getUserByBuyerId);
router.get("/propertyId/:propertyId", getUserByPropertyId);
module.exports = router;
