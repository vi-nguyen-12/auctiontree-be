const fs = require("fs");
const router = require("express").Router();
const { uploads3 } = require("../controller/propertyController");

router.post("/", uploads3.array("photos"), function (req, res) {
  res.send("Successfully uploaded " + req.files.length + " files!");
}); //need check jwt first, then can create property
module.exports = router;
