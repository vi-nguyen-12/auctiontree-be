const router = require("express").Router();
const { auth, authNotStrict } = require("../middleware/verifyToken");

const { sendChat } = require("../controller/chatController");

router.get("/", sendChat);
module.exports = router;
