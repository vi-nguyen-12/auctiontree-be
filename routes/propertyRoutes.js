const router = require("express").Router();
const { auth } = require("../middleware/verifyToken");
const {
  upload,
  search,
  createNewEstates,
} = require("../controller/propertyController");

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
