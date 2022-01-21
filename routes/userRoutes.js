const router = require("express").Router();
const {
  registerUser,
  login,
  logout,
  verify,
  getUserByBuyerId,
  getUserByPropertyId,
  checkJWT,
  sendEmailForgotPassword,
} = require("../controller/userController");

router.route("/register").post(registerUser);
router.route("/login").post(login);
router.route("/logout").get(logout);
router.route("/verify").post(verify);
router.route("/checkJWT").post(checkJWT);
router.post("/sendEmailResetPassword", sendEmailForgotPassword);
//only allow for admin user
router.get("/buyerId/:buyerId", getUserByBuyerId);
router.get("/propertyId/:propertyId", getUserByPropertyId);

module.exports = router;
