const fs = require("fs");
const router = require("express").Router();
const { upload, uploadFile } = require("../controller/propertyController");

router.post("/", upload, uploadFile); //need check jwt first, then can create property
module.exports = router;
