const fs = require("fs");
const router = require("express").Router();
const { upload } = require("../controller/propertyController");

router.post("/", upload.array("files"), function (req, res) {
  res.send("Successfully uploaded " + req.files.length + " files!");
}); //need check jwt first, then can create property
module.exports = router;
