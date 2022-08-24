const router = require("express").Router();
const { auth, authNotStrict } = require("../middleware/verifyToken");
// const { validateAuction } = require("../middleware/validateRequest");

const {
  createRole,
  getRoles,
  editRole,
} = require("../controller/roleController");

router.post("/", auth, createRole);
router.get("/", auth, getRoles);
router.put("/:id", auth, editRole);

module.exports = router;
