const router = require("express").Router();
const { auth } = require("../middleware/verifyToken");
const {
  validateProperty,
  validateOthers,
} = require("../middleware/validateRequest");
const {
  search,
  createRealestate,
  editRealestate,
  getProperties,
  getProperty,
  approveProperty,
  verifyDocument,
  verifyImage,
  verifyVideo,
  createOthers,
} = require("../controller/propertyController");

router.get("/real-estates/search", search);

//this should be only for user is admin
router.put("/:propertyId/documents/:documentId/status", verifyDocument);
router.put("/:propertyId/images/:imageId/status", verifyImage);
router.put("/:propertyId/videos/:videoId/status", verifyVideo);
router.put("/:id/status", approveProperty);

//for all users
router.get("/:id", getProperty);
router.get("/", getProperties);

//for logged in users
router.post("/real-estates/", auth, validateProperty, createRealestate);
router.post("/", auth, validateOthers, createOthers);
router.put("/real-estates/:id", auth, validateProperty, editRealestate);
module.exports = router;
