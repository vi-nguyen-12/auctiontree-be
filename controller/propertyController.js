const AWS = require("aws-sdk");
const Property = require("../model/Property");
const multer = require("multer");
const multerS3 = require("multer-s3");
const uuid = require("uuid/v4");
const axios = require("axios");

//@desc  upload images, videos and documents to AWS S3
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

//@desc  Search a real-estate with an address
//@route POST /api/properties/real-estates/search query params:{street_address, city, state}
const search = async (req, res) => {
  const { street_address, city, state } = req.query;
  // const response = await axios.get(process.env.THIRD_PARTY_API, {
  //   params: { street_address, city, state },
  // });
  // console.log(response.data);
  // res.status(200).json({ data: response.data.data });
  res.status(200).json({ message: "Get info from Estated works correctly !" });
};

//@desc  Create a property
//@route POST /api/properties/real-estates/ body:{type, street_address, city, state, images, videos, documents,fields}
const createNewEstates = async (req, res) => {
  const { type, street_address, city, state, fields } = req.body;
  const { rooms_count, beds_count, baths } = fields;

  const response = await axios.get(process.env.THIRD_PARTY_API, {
    params: { street_address, city, state },
  });

  const newEstates = new Property({
    createdBy: req.user.userId,
    type,
    details: response.data.data,
    images: req.files ? req.files.images : [],
    videos: req.files ? req.files.videos : [],
    documents: req.files ? req.files.documents : [],
  });
  newEstates.details.structure.rooms_count = rooms_count;
  newEstates.details.structure.beds_count = beds_count;
  newEstates.details.structure.baths = baths;

  const savedNewEstates = await newEstates.save();

  res.status(200).send(savedNewEstates);
};

module.exports = { upload, search, createNewEstates };
