const AWS = require("aws-sdk");
const Property = require("../model/Property");
const User = require("../model/User");
const Buyer = require("../model/Buyer");
const Auction = require("../model/Auction");
const multer = require("multer");
const multerS3 = require("multer-s3");
const uuid = require("uuid/v4");
const axios = require("axios");
const { sendEmail } = require("../helper");

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
  console.log(street_address, city, state);
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
//@route POST /api/properties/real-estates/ body:{type, street_address, city, state, images, videos, documents, reservedAmount, discussedAmount}
const createNewEstates = async (req, res) => {
  const {
    type,
    street_address,
    city,
    state,
    images,
    videos,
    documents,
    reservedAmount,
    discussedAmount,
  } = req.body;
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
    reservedAmount,
    discussedAmount,
  });
  // newEstates.details.structure.rooms_count = rooms_count;
  // newEstates.details.structure.beds_count = beds_count;
  // newEstates.details.structure.baths = baths;

  const savedNewEstates = await newEstates.save();

  const { email } = await User.findOne({ _id: req.user.userId }, "email");
  sendEmail({
    email,
    subject: "Auction 10X-Listing real-estate status",
    text: "Thank you for listing a property for sell. We are reviewing your documents and will instruct you the next step of selling process in short time. ",
  });

  res.status(200).send(savedNewEstates);
};

//@desc  List all real-estates
//@route GET /api/properties/real-estates
const getRealEstates = async (req, res) => {
  const results = await Property.find({ type: "real-estate" })
    .sort({
      createdAt: -1,
    })
    .limit(10);

  res.status(200).send(results);
};

//@desc  List real-estates in upcoming auctions
//@route GET /api/properties/real-estates/upcomingAuctions
const getRealEstatesUpcomingAuctions = async (req, res) => {
  const date = new Date();
  console.log(date);
  let allAuctions = await Auction.find({
    auctionEndDate: { $gte: new Date() },
  });

  for (let auction of allAuctions) {
    const property = await Property.findOne({ _id: auction.propertyId });
    auction.property = property;
  }

  const data = allAuctions
    .filter((auction) => {
      return auction.property.type === "real-estate";
    })
    .map((auction) => {
      return {
        _id: auction.property._id,
        type: auction.property.type,
        details: auction.property.details,
        images: auction.property.images,
        videos: auction.property.videos,
        documents: auction.property.documents,
        auctionDetails: {
          _id: auction._id,
          registerStartDate: auction.registerStartDate,
          registerEndDate: auction.registerEndDate,
          auctionStartDate: auction.auctionStartDate,
          auctionEndDate: auction.auctionEndDate,
        },
      };
    });

  res.status(200).send(data);
};

//@desc  List real-estates registered status for a logged in buyer
//@route GET /api/properties/real-estates/status?buyer=true
const getRealEstatesStatusBuyer = async (req, res) => {
  const { buyer } = req.query;
  if (!buyer) {
    return res.status(403).send("Please specify if user is buyer or seller");
  }
  const auctions = await Buyer.find({ userId: req.user.userId });
  for(let auction of auctions){
    const property
  }
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
  getRealEstatesUpcomingAuctions,
};
