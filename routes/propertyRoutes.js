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
} = require("../controller/propertyController");

router.get("/:id", getRealEstate);
router.get("/", getRealEstates);

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

router.post("/", auth, createNewEstates);
module.exports = router;
