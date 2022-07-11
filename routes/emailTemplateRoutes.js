const router = require("express").Router();
const { authAdmin } = require("../middleware/verifyToken");
const {
  createEmailTemplate,
  editEmailTemplate,
} = require("../controller/emailTemplateController");

router.post("/", authAdmin, createEmailTemplate);
router.put("/", authAdmin, editEmailTemplate);
module.exports = router;
