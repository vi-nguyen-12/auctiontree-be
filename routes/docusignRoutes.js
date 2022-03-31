const router = require("express").Router();
const { auth } = require("../middleware/verifyToken");
const {
  getSellerAgreementUIViews,
  callback,
  getEnvelopeStatus,
  sendEnvelope,
} = require("../controller/docusignController");

//how many docusigns are there in process??
router.get("/signature/:docName/uiviews", auth, getSellerAgreementUIViews);
router.get("/callback/:envelopeId", callback);
router.get("/envelopes/:envelopeId/status", getEnvelopeStatus);
router.get("/createAndSendEvelope", sendEnvelope);
module.exports = router;
