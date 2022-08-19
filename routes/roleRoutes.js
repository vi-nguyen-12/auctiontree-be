const router = require("express").Router();
const { auth, authNotStrict } = require("../middleware/verifyToken");
// const { validateAuction } = require("../middleware/validateRequest");

const { createRole } = require("../controller/roleController");

router.post("/", auth, createRole);

module.exports = router;
