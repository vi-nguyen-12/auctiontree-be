const AWS = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
const sharp = require("sharp");
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
// const uploadSharpS3 = multer({
//   storage: multerS3({
//     s3,
//     bucket,
//     acl: "public-read",
//     // contentType: multerS3.AUTO_CONTENT_TYPE,
//     contentDisposition: "inline",
//     metadata: function (req, file, cb) {
//       cb(null, {
//         fieldName: file.fieldname,
//       });
//     },
//     key: function (req, file, cb) {
//       cb(
//         null,
//         `${process.env.AWS_BUCKET_FOLDER}/` + uuid() + file.originalname
//       );
//     },
//     resize: { width: 80, height: 70 }, //should change this to dynamic size
//   }),
// });

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

//Resize image then upload
const uploadMulterResize = multer({ dest: "tmp/" });
const uploadResize = async (req, res) => {
  try {
    const image = await sharp(req.file.path)
      .resize(300, 150)
      .toFormat("jpeg")
      .jpeg({ quality: 80 })
      .toBuffer();

    const params = {
      Bucket: bucket,
      Key: `${process.env.AWS_BUCKET_FOLDER} + ${uuid()} + ${
        req.file.originalname
      }`,
      Body: image,
      ContentType: req.file.mimetype,
      ACL: "public-read",
    };

    // Store the image in S3
    const result = await s3.upload(params).promise();

    res.status(200).send({ name: req.file.originalname, url: result.Location });
  } catch (err) {
    res.status(500).send(err);
  }
};

module.exports = {
  uploadS3,
  // uploadSharpS3,
  upload,
  uploadAll,
  uploadMulterResize,
  uploadResize,
};
