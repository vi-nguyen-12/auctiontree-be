const router = require("express").Router();
const { auth } = require("../middleware/verifyToken");
const {
  validateProperty,
  validateOthers,
} = require("../middleware/validateRequest");
const {
  uploadS3,
  upload,
  uploadAll,
  search,
  createRealestate,
  editRealestate,
  getRealEstates,
  getRealEstate,
  getRealEstatesUpcomingAuctions,
  getRealEstatesOngoingAuctions,
  getRealEstatesStatusBuyer,
  approveProperty,
  verifyDocument,
  verifyImage,
  verifyVideo,
  createOthers,
} = require("../controller/propertyController");

router.get("/real-estates/search", search);

router.post(
  "/real-estates/images/upload",
  auth,
  uploadS3.array("images"),
  upload
);
router.post(
  "/real-estates/videos/upload",
  auth,
  uploadS3.array("videos"),
  upload
);
router.post(
  "/real-estates/documents/upload",
  auth,
  uploadS3.array("documents"),
  upload
);
router.post(
  "/real-estates/upload",
  auth,
  uploadS3.fields([
    { name: "images" },
    { name: "videos" },
    { name: "documents" },
  ]),
  uploadAll
);

router.get("/real-estates/upcomingAuctions", getRealEstatesUpcomingAuctions);
router.get("/real-estates/ongoingAuctions", getRealEstatesOngoingAuctions);

//this should be only for user is admin
router.put(
  "/real-estates/:propertyId/documents/:documentId/status",
  verifyDocument
);
router.put("/real-estates/:propertyId/images/:imageId/status", verifyImage);
router.put("/real-estates/:propertyId/videos/:videoId/status", verifyVideo);
router.put("/real-estates/:id/status", approveProperty);

//for all users
router.get("/real-estates/:id", getRealEstate);
router.get("/real-estates/", getRealEstates);

//for logged in users
router.get("/real-estates/status", auth, getRealEstatesStatusBuyer);
router.post("/real-estates/", auth, validateProperty, createRealestate);
router.post("/", auth, validateOthers, createOthers);
router.put("/real-estates/:id", auth, validateProperty, editRealestate);
module.exports = router;
