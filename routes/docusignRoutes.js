const router = require("express").Router();
const { auth } = require("../middleware/verifyToken");
const {
  createSellingAgreementURL,
  createBuyingAgreementURL,
  sendBuyingAgreementURLByEmail,
  getBuyingAgreementURL,
  callback,
  getDocusignView,
  sendUIViews,
  sendUIURLByEmail,
  getEnvelopeInfo,
  getDocusign,
  createURLFromDocusignId,
} = require("../controller/docusignController");

//how many docusigns are there in process??
router.post(
  "/signature/buying_agreement/:auctionId/uiviews",
  auth,
  createBuyingAgreementURL,
  sendUIViews
);

router.post(
  "/signature/buying_agreement/:auctionId/email",
  auth,
  createBuyingAgreementURL,
  sendBuyingAgreementURLByEmail
);

router.post(
  "/signature/buying_agreement/:auctionId/email",
  auth,
  getBuyingAgreementURL,
  sendUIURLByEmail
);

router.get(
  "/signature/selling_agreement/:propertyId/uiviews",
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
router.get(
  "/signature/:docusignId/uiviews",
  auth,
  createURLFromDocusignId,
  sendUIViews
);

router.get("/callback/:envelopeId", callback);
router.get("/envelopes/:id", getEnvelopeInfo);
router.get("/:id", getDocusign);
router.get("/:id/uiviews", getDocusignView);

module.exports = router;
