const router = require("express").Router();
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
} = require("../controller/userController");

router.route("/register").post(registerUser);
router.route("/login").post(login);
router.route("/logout").get(logout);
router.post("/confirmation/email", sendConfirmEmail);
router.post("/confirmation/verify", verify);
router.post("/checkJWT", checkJWT);
router.post("/password", resetForgotPassword);
//only allow for admin user
router.get("/buyerId/:buyerId", getUserByBuyerId);
router.get("/propertyId/:propertyId", getUserByPropertyId);

module.exports = router;
