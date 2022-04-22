const router = require("express").Router();
const { authUser } = require("../middleware/verifyToken");
const { verifyKyc, callback } = require("../controller/kycController");

router.get("/verifyKyc", authUser, verifyKyc);
router.get("/hook/callback", callback);

module.exports = router;
