const router= require('express').Router();
const kycController =require("../controller/kycController")

router.route("/fetchKycStatus").post(kycController.fetchKycStatus)
router.route("/verifyKyc").post(kycController.verifyKyc)

module.exports=router