const router = require("express").Router();
const { auth } = require("../middleware/verifyToken");
const {
  uploadS3,
  // uploadSharpS3,
  upload,
  uploadAll,
  uploadMulterResize,
  uploadResize,
} = require("../controller/awsController");

// router.post("/images/upload", auth, uploadS3.array("images"), upload);
// router.post("/videos/upload", auth, uploadS3.array("videos"), upload);
// router.post("/documents/upload", auth, uploadS3.array("documents"), upload);
// router.post(
//   "/upload",
//   auth,
//   uploadS3.fields([
//     { name: "images" },
//     { name: "videos" },
//     { name: "documents" },
//   ]),
//   uploadAll
// );
router.post(
  "/image/resize/upload",
  uploadMulterResize.single("image"),
  uploadResize
);
router.post("/images/upload", uploadS3.array("images"), upload);
router.post("/videos/upload", uploadS3.array("videos"), upload);
router.post("/documents/upload", uploadS3.array("documents"), upload);
router.post(
  "/upload",
  uploadS3.fields([
    { name: "images" },
    { name: "videos" },
    { name: "documents" },
  ]),
  uploadAll
);

module.exports = router;
