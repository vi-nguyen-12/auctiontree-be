const fs = require("fs");
const router = require("express").Router();
const { auth } = require("../middleware/verifyToken");
const { upload, search } = require("../controller/propertyController");

router.get("/search", search);
// router.post("/",auth,upload,save)
router.post(
  "/upload",
  upload.fields([{ name: "images" }, { name: "videos" }]),
  function (req, res) {
    const numOfImages = req.files.images.length;
    const numOfVideos = req.files.videos.length;
    res.send(
      `Successfully uploaded ${numOfImages} images and ${numOfVideos} videos`
    );
    //req.files return an object {images:[...], videos:[...]} -> save this in DB of property
  }
); //need check jwt first, then can create property

module.exports = router;
