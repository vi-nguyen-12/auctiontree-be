const router= require('express').Router();
const userController =require("../controller/userController")

router.route("/register").post(userController.registerUser);
router.route("/login").post(userController.login)
router.route("./checkJWT").post(userController.checkJWT)
router.route("/verify").post(userController.verify)

module.exports=router