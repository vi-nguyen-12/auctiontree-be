const router = require("express").Router();
const {
  registerUser,
  login,
  verify,
  checkJWT,
} = require("../controller/userController");

router.route("/register").post(registerUser);
router.route("/login").post(login);
router.route("/verify").post(verify);
router.route("/checkJWT").post(checkJWT);

module.exports = router;
