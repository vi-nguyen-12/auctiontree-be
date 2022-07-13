const router = require("express").Router();
const { authAdmin } = require("../middleware/verifyToken");
const {
  createEmailTemplate,
  editEmailTemplate,
  getEmailTemplates,
} = require("../controller/emailTemplateController");

router.post("/", authAdmin, createEmailTemplate);
router.put("/:id", authAdmin, editEmailTemplate);
router.get("/", authAdmin, getEmailTemplates);
module.exports = router;
