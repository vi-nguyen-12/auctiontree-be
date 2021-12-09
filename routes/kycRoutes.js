const router = require("express").Router();
const { auth } = require("../middleware/verifyToken");
const { verifyKyc } = require("../controller/kycController");

router.route("/verifyKyc").get(verifyKyc);
router.route("/hook/callback", () => {});

module.exports = router;
