const router = require("express").Router();
const { auth } = require("../middleware/verifyToken");
const {
  createSellingAgreementURL,
  createBuyingAgreementURL,
  callback,
  getDocusignView,
  sendUIViews,
  sendUIURLByEmail,
  getEnvelopeInfo,
} = require("../controller/docusignController");

//how many docusigns are there in process??
router.get(
  "/signature/buying_agreement/:auctionId/uiviews",
  auth,
  createBuyingAgreementURL,
  sendUIViews
);

router.get(
  "/signature/sellinuserg_agreement/:propertyId/uiviews",
  auth,
  createSellingAgreementURL,
  sendUIViews
);

router.get(
  "/signature/selling_agreement/:propertyId/email",
  auth,
  createSellingAgreementURL,
  sendUIURLByEmail
);
router.get("/callback/:envelopeId", callback);
router.get("/envelopes/:id", getEnvelopeInfo);
router.get("/", getDocusignView);

module.exports = router;
