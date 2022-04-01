const router = require("express").Router();
const { auth } = require("../middleware/verifyToken");
// const { validateAuction } = require("../middleware/validateRequest");

const { createAdmin, login } = require("../controller/adminController");

// need to check if the user is admin
router.post("/", createAdmin);
router.post("/login", login);

module.exports = router;
