const router = require("express").Router();
const { auth } = require("../middleware/verifyToken");
const { validateProperty } = require("../middleware/validateRequest");
const {
  uploadS3,
  upload,
  uploadAll,
  search,
  createNewEstates,
  editProperty,
  getRealEstates,
  getRealEstate,
  getRealEstatesUpcomingAuctions,
  getRealEstatesOngoingAuctions,
  getRealEstatesStatusBuyer,
  approveProperty,
  verifyDocument,
  verifyImage,
  verifyVideo,
} = require("../controller/propertyController");

router.get("/search", search);

router.post("/images/upload", auth, uploadS3.array("images"), upload);
router.post("/videos/upload", auth, uploadS3.array("videos"), upload);
router.post("/documents/upload", auth, uploadS3.array("documents"), upload);
router.post(
  "/upload",
  auth,
  uploadS3.fields([
    { name: "images" },
    { name: "videos" },
    { name: "documents" },
  ]),
  uploadAll
);

router.get("/upcomingAuctions", getRealEstatesUpcomingAuctions);
router.get("/ongoingAuctions", getRealEstatesOngoingAuctions);

//this should be only for user is admin
router.put("/:propertyId/documents/:documentId/status", verifyDocument);
router.put("/:propertyId/images/:imageId/status", verifyImage);
router.put("/:propertyId/videos/:videoId/status", verifyVideo);
router.put("/:id/status", approveProperty);

//for all users
router.get("/:id", getRealEstate);
router.get("/", getRealEstates);

//for logged in users
router.get("/status", auth, getRealEstatesStatusBuyer);
router.post("/", auth, validateProperty, createNewEstates);
router.put("/:id", auth, validateProperty, editProperty);
module.exports = router;
