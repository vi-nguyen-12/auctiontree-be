const router = require("express").Router();
const { auth } = require("../middleware/verifyToken");
// const { validateAuction } = require("../middleware/validateRequest");

const {
  createAdmin,
  editAdmin,
  login,
} = require("../controller/adminController");

// need to check if the user is admin
router.post("/", auth, createAdmin);
router.put("/:id", auth, editAdmin);
router.post("/login", login);

module.exports = router;
