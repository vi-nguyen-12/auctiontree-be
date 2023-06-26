const AWS = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
const uuid = require("uuid/v4");

//@desc  upload images, videos and documents to AWS S3
const config = {
  region: "us-east-2",
  apiVersion: "2006-03-01",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};
const bucket = process.env.AWS_BUCKET_NAME;

const s3 = new AWS.S3(config);

const uploadS3 = multer({
  storage: multerS3({
    s3,
    bucket,
    acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    contentDisposition: "inline",
    metadata: function (req, file, cb) {
      cb(null, {
        fieldName: file.fieldname,
      });
    },
    key: function (req, file, cb) {
      cb(
        null,
        `${process.env.AWS_BUCKET_FOLDER}/` + uuid() + file.originalname
      );
    },
  }),
});

const upload = async (req, res) => {
  const data = req.files.map((item) => {
    return { name: item.originalname, url: item.location };
  });
  res.status(200).send(data);
};

const uploadAll = async (req, res) => {
  let result = {};
  for (let key in req.files) {
    result[key] = req.files[key].map((item) => {
      return { name: item.originalname, url: item.location };
    });
  }
  res.status(200).send(result);
};

module.exports = {
  uploadS3,
  upload,
  uploadAll,
};
