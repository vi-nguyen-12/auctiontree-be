const router = require("express").Router();
const { auth } = require("../middleware/verifyToken");
const { upload } = require("../controller/propertyController");
const Document = require("../model/Property");
const Property = require("../model/Property");

router.post(
  "/upload",
  auth,
  upload.fields([
    { name: "images" },
    { name: "videos" },
    { name: "documents" },
  ]),
  async (req, res) => {
    if (req.files?.documents?.length) {
      const documents = [];

      const createNewDocument = async (item) => {
        const document = new Document({
          name: item.originalname,
          details: item,
        });
        await document.save();
      };

      for (const item of req.files.documents) {
        console.log(item);
        const document = createNewDocument(item);
        documents.push(document);
      }
      // const property = new Property({
      //   type: "real-estate",
      //   createdBy: "test",
      //   documents,
      // });
      // await property.save();
      res.status(200).send({ data: documents });
    } else {
      res.status(200).send("no files");
    }
  }
  // (req, res) => {
  //   res.send(req.files);
  // }
);

module.exports = router;
