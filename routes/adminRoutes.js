const router = require("express").Router();
const { auth, authAdmin, authNotStrict } = require("../middleware/verifyToken");
const { validateAdmin } = require("../middleware/validateRequest");

const {
  createAdmin,
  editAdmin,
  deleteAdmin,
  getAllAdmins,
  getAdmin,
  login,
  checkJWT,
  forgotPassword,
  deleteNotification,
} = require("../controller/adminController");

// need to check if the user is admin
router.put("/password", authNotStrict, forgotPassword);
router.post("/", authAdmin, validateAdmin, createAdmin);
router.put("/:id", authAdmin, editAdmin);
router.delete(
  "/:adminId/notifications/:notificationId",
  authAdmin,
  deleteNotification
);
router.delete("/:id", authAdmin, deleteAdmin);
router.get("/", authAdmin, getAllAdmins);
router.get("/:id", authAdmin, getAdmin);
router.post("/login", login);
router.post("/checkJWT", checkJWT);

module.exports = router;
