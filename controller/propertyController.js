const AWS = require("aws-sdk");
const e = require("express");
const multer = require("multer");
const multerS3 = require("multer-s3");
const uuid = require("uuid/v4");

//@desc  Create a property
//@route POST /api/properties body:{type, description, images}

//need to check if body has images or not, if not don't need to create s3 object, go directly to save info to db
const config = {
  region: "us-east-2",
  apiVersion: "2006-03-01",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};
const bucket = process.env.AWS_BUCKET_NAME;

const s3 = new AWS.S3(config);

const upload = multer({
  storage: multerS3({
    s3,
    bucket,
    acl: "public-read",
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, uuid() + file.originalname);
    },
  }),
});

module.exports = { upload };
