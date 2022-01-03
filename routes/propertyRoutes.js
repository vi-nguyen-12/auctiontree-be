const router = require("express").Router();
const { auth } = require("../middleware/verifyToken");
const {
  uploadS3,
  upload,
  uploadAll,
  search,
  createNewEstates,
  getRealEstates,
  getRealEstate,
  getRealEstatesUpcomingOrOnGoingAuctions,
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

router.get("/upcomingAuctions", getRealEstatesUpcomingOrOnGoingAuctions);
router.get("/ongoingAuctions", getRealEstatesUpcomingOrOnGoingAuctions);
router.get("/:id", getRealEstate);
router.get("/", getRealEstates);
router.post("/", auth, createNewEstates);
module.exports = router;
