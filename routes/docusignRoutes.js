const router = require("express").Router();
const { auth } = require("../middleware/verifyToken");
const {
  createUIURL,
  callback,
  getEnvelopeStatus,
  sendEnvelope,
  sendUIViews,
  sendUIURLByEmail,
  getEnvelopeInfo,
} = require("../controller/docusignController");

//how many docusigns are there in process??
router.get(
  "/signature/:docName/:propertyId/uiviews",
  auth,
  createUIURL,
  sendUIViews
);
router.get(
  "/signature/:docName/:propertyId/email",
  auth,
  createUIURL,
  sendUIURLByEmail
);
router.get("/callback/:envelopeId", callback);
router.get("/envelopes/:envelopeId/status", getEnvelopeStatus);
router.get("/envelopes/:envelopeId", getEnvelopeInfo);

module.exports = router;
