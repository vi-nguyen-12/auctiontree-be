const router= require('express').Router();
const userController =require("../controller/userController")

router.route("/register").post(userController.registerUser);
router.route("/login").post(userController.authUser)
router.route("/verify").post(userController.verify)
router.route("/sendToken").post(userController.sendToken)
router.route("/validate").post(userController.validate)

module.exports=router