const AWS = require("aws-sdk");
const multer = require("multer");
const uuid = require("uuid/v4");

//@desc  Create a property
//@route POST /api/properties body:{type, description, images}

//need to check if body has images or not, if not don't need to create s3 object, go directly to save info to db
const s3 = new AWS.S3({
  region: "us-east-2",
  apiVersion: "2006-03-01",
  accessKeyId: "AKIAYR3J7DAWLRVYH3PP",
  secretAccessKey: "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",
});

const storage = multer.memoryStorage({
  destination: function (req, file, callback) {
    callback(null, "/uploads");
  },
});
const upload = multer({ storage }).single("image");

const uploadFile = async (req, res) => {
  let file = req.file.originalname.split(".");
  let fileType = file[file.length - 1];
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `${uuid()}.${fileType}`,
    Body: req.file.buffer,
  };
  s3.upload(params, function (error, data) {
    if (error) {
      res.status(500).send(error);
    }
    res.status(200).send({
      //   message: `File uploaded successfully at ${data.Location}`,
      data,
    });
  });
};

exports.uploadFile = uploadFile;
exports.upload = upload;
