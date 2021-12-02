const AWS = require("aws-sdk");
const Property = require("../model/Property");
const multer = require("multer");
const multerS3 = require("multer-s3");
const uuid = require("uuid/v4");
const axios = require("axios");

//@desc  Search a real-estate with an address
//@route POST /api/properties/real-estates/search?street_address=&city=&state=&zip_code=
const search = async (req, res) => {
  const { street_address, city, state } = req.query;
  const response = await axios.get(process.env.THIRD_PARTY_API, {
    params: { street_address, city, state },
  });
  console.log(response.data);
  res.status(200).json({ data: response.data.data });
  // res.status(200).json({ message: "Get info from Estated works correctly !" });
};

//@desc  Create a property
//@route POST /api/properties/real-estates/ body:{type, description, images}

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

module.exports = { upload, search };
