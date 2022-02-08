const router = require("express").Router();
const { auth } = require("../middleware/verifyToken");
const {
  getSellerAgreementUIViews,
  callback,
  getEnvelopeStatus,
  createAndSendEnvelope,
} = require("../controller/docusignController");

//how many docusigns are there in process??
router.get(
  "/signature/sellerAgreement/uiviews",
  auth,
  getSellerAgreementUIViews
);
router.get("/callback/:envelopeId", callback);
router.get("/envelopes/:envelopeId/status", getEnvelopeStatus);
router.get("/createAndSendEvelope", createAndSendEnvelope);
module.exports = router;
