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

const uploadS3 = multer({
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

//@desc  Search a real-estate with an address
//@route POST /api/properties/real-estates/search query params:{street_address, city, state}
const search = async (req, res) => {
  const { street_address, city, state } = req.query;
  try {
    const response = await axios.get(process.env.THIRD_PARTY_API, {
      params: { street_address, city, state },
    });
    // const addressExist = await Property.findOne({
    //   type: "real-estate",
    //   "details.address.formatted_street_address": response.data.data.address.formatted_street_address,
    // });
    // console.log(addressExist.createdAt);
    // if (
    //   addressExist
    //   //   && addressExit.createdAt - Date.now() > 182 * 24 * 60 * 60 * 1000
    // ) {
    //   res.status(200).send({ data: "This address is already registed to sell" });
    // } else {
    //   res.status(200).send({ data: response.data.data });
    // }
    res.status(200).send(response.data.data);
  } catch (error) {
    res.send(error);
  }
};

//@desc  Create a property
//@route POST /api/properties/real-estates/ body:{type, street_address, city, state, images, videos, documents}
const createNewEstates = async (req, res) => {
  const { type, street_address, city, state, images, videos, documents } =
    req.body;
  // const { rooms_count, beds_count, baths } = fields;

  const response = await axios.get(process.env.THIRD_PARTY_API, {
    params: { street_address, city, state },
  });

  const newEstates = new Property({
    createdBy: req.user.userId,
    type,
    details: response.data.data,
    images,
    videos,
    documents,
  });
  // newEstates.details.structure.rooms_count = rooms_count;
  // newEstates.details.structure.beds_count = beds_count;
  // newEstates.details.structure.baths = baths;

  const savedNewEstates = await newEstates.save();

  res.status(200).send(savedNewEstates);
};

//@desc  List real-estates
//@route GET /api/properties/real-estates
const getRealEstates = async (req, res) => {
  const results = await Property.find({ type: "real-estate" });
  res.status(200).send({ data: results });
};

//@desc  Get information of a real estate
//@route GET /api/properties/real-estates/:id
const getRealEstate = async (req, res) => {
  try {
    const realEstate = await Property.findOne({
      _id: req.params.id,
      type: "real-estate",
    });
    if (!realEstate) {
      return res.status(200).send("No real-estate found");
    }
    res.status(200).send(realEstate);
  } catch (error) {
    res.send(error);
  }
};
module.exports = {
  uploadS3,
  upload,
  uploadAll,
  search,
  createNewEstates,
  getRealEstates,
  getRealEstate,
};
