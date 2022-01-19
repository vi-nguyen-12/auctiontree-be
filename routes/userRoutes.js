const router = require("express").Router();
const {
  registerUser,
  login,
  logout,
  verify,
  checkJWT,
  getUserByBuyerId,
} = require("../controller/userController");

router.route("/register").post(registerUser);
router.route("/login").post(login);
router.route("/logout").get(logout);
router.route("/verify").post(verify);
router.route("/checkJWT").post(checkJWT);
//only allow for admin user
router.get("/buyerId/:buyerId", getUserByBuyerId);

module.exports = router;
