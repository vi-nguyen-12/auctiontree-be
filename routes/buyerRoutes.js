const router = require("express").Router();
const { auth } = require("../middleware/verifyToken");
const { checkKyc } = require("../middleware/checkKyc");
const { createBuyer } = require("../controller/buyerController");

router.post("/", auth, checkKyc, createBuyer);
module.exports = router;
