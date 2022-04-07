const router = require("express").Router();
const { auth, authNotStrict } = require("../middleware/verifyToken");
const {} = require("../middleware/validateRequest");
const {
  search,
  getProperties,
  getProperty,
  approveProperty,
  verifyDocument,
  verifyImage,
  verifyVideo,
  createOthers,
  editOthers,
  createRealestate,
  editRealestate,
  deleteProperty,
} = require("../controller/propertyController");

router.get("/real-estates/search", search);

//this should be only for user is admin
router.put("/:propertyId/documents/:documentId/status", auth, verifyDocument);
router.put("/:propertyId/images/:imageId/status", auth, verifyImage);
router.put("/:propertyId/videos/:videoId/status", auth, verifyVideo);
router.put("/:id/status", auth, approveProperty);

//for all users
router.get("/:id", auth, getProperty);
router.get("/", auth, getProperties);

router.post("/real-estate", auth, createRealestate);
router.post("/", auth, createOthers);
router.put("/real-estate/:id", auth, editRealestate);
router.put("/:id", auth, editOthers);
router.delete("/:id", auth, deleteProperty);
module.exports = router;
