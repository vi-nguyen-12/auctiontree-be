const router = require("express").Router();
const { auth } = require("../middleware/verifyToken");
const {
  uploadS3,
  upload,
  search,
  createNewEstates,
  getRealEstates,
} = require("../controller/propertyController");

router.get("/", getRealEstates);

router.get("/search", search);

router.post("/images/upload", auth, uploadS3.array("images"), upload);

router.post("/", auth, createNewEstates);
module.exports = router;
