const router = require("express").Router();
const { auth } = require("../middleware/verifyToken");
const { verifyKyc, callback } = require("../controller/kycController");

router.get("/verifyKyc", auth, verifyKyc);
router.get("/hook/callback", callback);

module.exports = router;
