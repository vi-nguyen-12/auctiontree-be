const AWS = require("aws-sdk");
const e = require("express");
const multer = require("multer");
const multerS3 = require("multer-s3");
const uuid = require("uuid/v4");

//@desc  Create a property
//@route POST /api/properties body:{type, description, images}

//need to check if body has images or not, if not don't need to create s3 object, go directly to save info to db
const s3 = new AWS.S3({
  region: "us-east-2",
  apiVersion: "2006-03-01",
  accessKeyId: "AKIAYR3J7DAWERU6CO4A",
  secretAccessKey: "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",
});

// const storage = multer.memoryStorage({
//   destination: function (req, file, callback) {
//     callback(null, "/uploads");
//   },
// });
// const upload = multer({ storage }).single("image");
const bucket = process.env.AWS_BUCKET_NAME;
const uploads3 = multer({
  storage: multerS3({
    s3,
    bucket: "auction10x-test",
    acl: "public-read",
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, uuid() + file.originalname);
    },
  }),
});

// const uploadFile = async (req, res) => {
//   let file = req.file.originalname.split(".");
//   let fileType = file[file.length - 1];
//   const params = {
//     Bucket: process.env.AWS_BUCKET_NAME,
//     Key: `${uuid()}.${fileType}`,
//     Body: req.file.buffer,
//   };
//   s3.upload(params, function (error, data) {
//     if (error) {
//       res.status(500).send(error);
//     }
//     res.status(200).send({
//       //   message: `File uploaded successfully at ${data.Location}`,
//       data,
//     });
//   });
// };

// exports.uploadFile = uploadFile;
// exports.upload = upload;
module.exports = { uploads3 };
