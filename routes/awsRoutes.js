const router = require("express").Router();
const { auth } = require("../middleware/verifyToken");
const { uploadS3, upload, uploadAll } = require("../controller/awsController");

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

module.exports = router;
