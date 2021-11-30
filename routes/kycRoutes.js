const router= require('express').Router();
const kycController =require("../controller/kycController")

router.route("/fetchKycStatus").get(kycController.fetchKycStatus)
router.route("/verifyKyc").get(kycController.verifyKyc)

module.exports=router