const router = require("express").Router();
const { auth } = require("../middleware/verifyToken");
const { upload } = require("../controller/propertyController");

router.post(
  "/upload",
  auth,
  upload.fields([
    { name: "images" },
    { name: "videos" },
    { name: "documents" },
  ]),
  (req, res) => {
    res.send(req.files);
  }
);

module.exports = router;
