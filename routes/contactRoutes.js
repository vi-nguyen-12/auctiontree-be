const router = require("express").Router();
const { auth } = require("../middleware/verifyToken");

const { sendEmailToAdmin } = require("../controller/contactController");

// need to check if the user is admin
router.post("/", sendEmailToAdmin);

module.exports = router;
