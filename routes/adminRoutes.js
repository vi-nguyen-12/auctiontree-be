const router = require("express").Router();
const { auth } = require("../middleware/verifyToken");
// const { validateAuction } = require("../middleware/validateRequest");

const {
  createAdmin,
  editAdmin,
  deleteAdmin,
  getAllAdmin,
  getAdmin,
  login,
} = require("../controller/adminController");

// need to check if the user is admin
router.post("/", auth, createAdmin);
router.put("/:id", auth, editAdmin);
router.delete("/:id", auth, deleteAdmin);
router.get("/", auth, getAllAdmin);
router.get("/:id", auth, getAdmin);
router.post("/login", login);

module.exports = router;
