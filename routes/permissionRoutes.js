const router = require("express").Router();
const { auth, authNotStrict, authAdmin } = require("../middleware/verifyToken");

const {
  createPermission,
  getPermissions,
  editPermission,
} = require("../controller/permissionController");

router.post("/", createPermission);
router.get("/", authAdmin, getPermissions);
router.put("/:id", auth, editPermission);

module.exports = router;
