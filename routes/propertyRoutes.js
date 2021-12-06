const router = require("express").Router();
const { auth } = require("../middleware/verifyToken");
const {
  upload,
  search,
  createNewEstates,
  getRealEstates,
} = require("../controller/propertyController");

router.get("/", getRealEstates);

router.get("/search", search);

router.post(
  "/",
  auth,
  upload.fields([
    { name: "images" },
    { name: "videos" },
    { name: "documents" },
  ]),
  createNewEstates
);
module.exports = router;
