const router = require("express").Router();
const { auth } = require("../middleware/verifyToken");
const { uploadS3 } = require("../controller/propertyController");
const Document = require("../model/Property");
const Property = require("../model/Property");

router.post();

module.exports = router;
