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
  getUser,
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
  setDueDiligence,
  approveBroker,
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
router.get(
  "/seller/properties",
  authAdmin,
  getPropertiesOfAllSellersGroupByUser
);
router.get("/buyer/auctions", getAuctionsOfAllBuyersGroupedByUser);
router.get("/:id/seller/auctions", getAuctionsOfSeller);
router.get("/:id/seller/properties", auth, getListingsOfSeller);
router.get("/:id", auth, getUser);
router.get("/", authNotStrict, getAllUsers);
//only for login user
router.put("/:id/suspended", auth, suspendUserAccount);
router.put("/:id/due_diligence/:propertyId", auth, setDueDiligence);
router.put("/:id", auth, validateUpdateUser, editProfile);
router.delete(
  "/:userId/notifications/:notificationId",
  auth,
  deleteNotification
);
router.delete("/:id", auth, deleteUserAccount);
//only for admin
router.get("/buyerId/:buyerId", getUserByBuyerId);
router.get("/propertyId/:propertyId", getUserByPropertyId);
router.put("/broker/:id", auth, approveBroker);
module.exports = router;
