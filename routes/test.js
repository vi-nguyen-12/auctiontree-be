const router = require("express").Router();
const { auth } = require("../middleware/verifyToken");
const { upload } = require("../controller/propertyController");
const Document = require("../model/Property");
const Property = require("../model/Property");

router.post(
  "/upload",
  upload.fields([
    { name: "images" },
    { name: "videos" },
    { name: "documents" },
  ]),
  async (req, res) => {
    console.log(req.files);
    if (req.files?.documents?.length) {
      const documents = req.files.documents.map((item) => {
        console.log(item);
        return { name: item.originalname, details: item };
      });
      const property = new Property({
        type: "real-estate",
        createdBy: "test",
        documents,
      });
      const savedProperty = await property.save();
      res.status(200).send({ data: savedProperty });
    } else {
      res.status(200).send("no files");
    }
  }
);

module.exports = router;
