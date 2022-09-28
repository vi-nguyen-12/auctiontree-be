const router = require("express").Router();
const { auth, authAdmin, authNotStrict } = require("../middleware/verifyToken");
const { validateAdmin } = require("../middleware/validateRequest");

const {
  getSiteMaintenance,
  updateSiteMaintenance,
  createSiteMaintenance
} = require("../controller/siteController");

router.get("/", authNotStrict, getSiteMaintenance);
router.put("/", updateSiteMaintenance);
router.post("/", createSiteMaintenance);

module.exports = router;
