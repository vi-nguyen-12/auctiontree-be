const router = require("express").Router();
const { auth } = require("../middleware/verifyToken");
const {
  getSellerAgreementUIViews,
  callback,
} = require("../controller/docusignController");

//how many docusigns are there in process:
router.get(
  "/signature/sellerAgreement/uiviews",
  auth,
  getSellerAgreementUIViews
);
router.get("/callback", callback);

module.exports = router;
