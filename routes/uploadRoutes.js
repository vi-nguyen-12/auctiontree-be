const fs = require('fs');
const router= require('express').Router();
const uploadController =require("../controller/uploadController")

router.route("/").post(uploadController.uploadFile);

module.exports=router