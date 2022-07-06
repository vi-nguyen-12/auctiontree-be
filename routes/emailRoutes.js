const router = require("express").Router();
const { authNotStrict } = require("../middleware/verifyToken");
const { createEmail } = require("../controller/emailController");

router.post("/", authNotStrict, createEmail);
module.exports = router;
