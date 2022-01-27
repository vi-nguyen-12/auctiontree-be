const AWS = require("aws-sdk");
const Property = require("../model/Property");
const User = require("../model/User");
const Buyer = require("../model/Buyer");
const Auction = require("../model/Auction");
const multer = require("multer");
const multerS3 = require("multer-s3");
const uuid = require("uuid/v4");
const axios = require("axios");
const { sendEmail, getBidsInformation } = require("../helper");

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

  if (discussedAmount > reservedAmount) {
    return res.status(200).send({
      error: "Discussed amount must be less than or equal to reserved amount",
    });
  }

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

//@desc  Edit a property
//@route PUT /api/properties/real-estates/:id body:{type, street_address, city, state, images, videos, documents, reservedAmount, discussedAmount}
const editProperty = async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) return res.status(404).send("No property is found!");
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

  if (discussedAmount > reservedAmount) {
    return res.status(200).send({
      error: "Discussed amount must be less than or equal to reserved amount",
    });
  }

  const response = await axios.get(process.env.THIRD_PARTY_API, {
    params: { street_address, city, state },
  });
  console.log(response.data);

  property.type = type;
  property.street_address = street_address;
  property.city = city;
  property.state = state;
  property.images = images;
  property.videos = videos;
  property.documents = documents;
  property.reservedAmount = reservedAmount;
  property.discussedAmount = discussedAmount;

  const updatedProperty = property.save();
  const { email } = await User.findOne({ _id: req.user.userId }, "email");
  sendEmail({
    email,
    subject: "Auction 10X- Updating property",
    text: "Thank you for updating your property. We are reviewing your documents and will instruct you the next step of selling process in short time. ",
  });

  res.status(200).send(updatedProperty);
};

//@desc  List real estates (sorting by created date) by page and limit
//@desc filter by: ?status=... & inAuction=true
//@route GET /api/properties/real-estates
const getRealEstates = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { inAuction, status: isApproved } = req.query;
    const filters = {
      type: "real-estate",
    };
    if (isApproved) {
      filters.isApproved = isApproved;
    }
    let properties = [];
    if (inAuction === "true") {
      const auctions = await Auction.find().select("propertyId");
      const propertyIds = auctions.map((auction) => auction.propertyId);
      properties = await Property.find({ _id: propertyIds })
        .find(filters)
        .sort({
          createdAt: -1,
        })
        .skip((page - 1) * limit)
        .limit(limit);
    } else if (inAuction === "false") {
      const auctions = await Auction.find().select("propertyId");
      const propertyIds = auctions.map((item) => item.propertyId.toString());
      const allProperties = await Property.find();
      properties = allProperties.reduce((prev, current) => {
        if (propertyIds.indexOf(current._id.toString()) < 0) {
          prev.push(current);
        }
        return prev;
      }, []);
    } else {
      properties = await Property.find(filters)
        .sort({
          createdAt: -1,
        })
        .skip((page - 1) * limit)
        .limit(limit);
    }

    res.status(200).send(properties);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//@desc  List real-estates in upcoming auctions
//@route GET /api/properties/real-estates/upcomingAuctions
const getRealEstatesUpcomingAuctions = async (req, res) => {
  const now = new Date();
  const allAuctions = await Auction.find({
    auctionStartDate: { $gte: now },
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
          startingBid: auction.startingBid,
        },
      };
    });

  res.status(200).send(data);
};

//@desc  List real-estates in ongoing auctions
//@route GET /api/properties/real-estates/ongoingAuctions
const getRealEstatesOngoingAuctions = async (req, res) => {
  const now = new Date();
  const allAuctions = await Auction.find({
    auctionStartDate: { $lte: now },
    auctionEndDate: { $gte: now },
  });
  for (let auction of allAuctions) {
    const property = await Property.findOne({ _id: auction.propertyId });
    const { numberOfBids, highestBid, highestBidders } =
      await getBidsInformation(auction.bids, auction.startingBid);
    auction.property = property;
    auction.numberOfBids = numberOfBids;
    auction.highestBid = highestBid;
    auction.highestBidders = highestBidders;
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
          startingBid: auction.startingBid,
          numberOfBids: auction.numberOfBids,
          highestBid: auction.highestBid,
          highestBidders: auction.highestBidders,
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
  try {
    const registeredList = await Buyer.find({ userId: req.user.userId });
    if (registeredList.length === 0) {
      return res
        .status(200)
        .send("This user has not register to buy any property");
    }
    for (let item of registeredList) {
      const auction = await Auction.findOne({ _id: item.auctionId });
      const property = await Property.findOne({ _id: auction.propertyId });
      item.auction = auction;
      item.property = property;
    }
    const data = registeredList.map((item) => {
      return {
        _id: item.property._id,
        type: item.property.type,
        details: item.property.details,
        images: item.property.images,
        videos: item.property.videos,
        documents: item.property.documents,
        auctionDetails: {
          _id: item.auction._id,
          registerStartDate: item.auction.registerStartDate,
          registerEndDate: item.auction.registerEndDate,
          auctionStartDate: item.auction.auctionStartDate,
          auctionEndDate: item.auction.auctionEndDate,
        },
        isApproved: item.isApproved,
      };
    });
    res.status(200).send(data);
  } catch (err) {
    res.status(500).send(err.message);
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

//@desc  Approve a property
//@route PUT /api/properties/real-estates/:id/status body: {status: "pending"/"success"/"fail", rejectedReason:...  }

const approveProperty = async (req, res) => {
  try {
    const { status, rejectedReason } = req.body;
    const property = await Property.findOne({ _id: req.params.id });
    if (!property) {
      res.status(200).send({ error: "Property not found" });
    }
    const user = await User.findById(property.createdBy);

    if (status === "success") {
      for (let image of property.images) {
        if (image.isVerified !== "success")
          return res
            .status(200)
            .send({ error: `Image ${image.name}is not verified` });
      }
      for (let video of property.videos) {
        if (video.isVerified !== "success")
          return res
            .status(200)
            .send({ error: `Video ${video.name}is not verified` });
      }
      for (let document of property.documents) {
        if (document.isVerified !== "success")
          return res
            .status(200)
            .send({ error: `Document ${document.name}is not verified` });
      }
      sendEmail({
        email: user.email,
        subject: "Auction10X- Property Application Approved",
        text: `Congratulation, your application to sell property is approved`,
      });
    }
    if (status === "fail") {
      if (!rejectedReason) {
        return res
          .status(200)
          .send({ error: "Please specify reason for reject" });
      }
      property.rejectedReason = rejectedReason;
      sendEmail({
        email: user.email,
        subject: "Auction10X- Property Application Rejected",
        text: `Your application to sell property is rejected. Reason: ${rejectedReason}`,
      });
    }
    property.isApproved = status;
    const savedProperty = await property.save();
    const result = {
      _id: savedProperty._id,
      createdBy: savedProperty.createdBy,
      type: savedProperty.type,
      isApproved: savedProperty.isApproved,
      rejectedReason: savedProperty.rejectedReason,
    };
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

//@desc  Verify a document
//@route PUT /:propertyId/documents/:documentId/status"  body: {status:"pending"/"success"/"fail"}
const verifyDocument = async (req, res) => {
  const { status } = req.body;
  if (status !== "pending" && status !== "success" && status !== "fail") {
    return res.status(404).send({
      message: "Status value must be 'pending' or 'success' or 'fail'",
    });
  }
  const { propertyId, documentId } = req.params;

  try {
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).send("Property not found");
    }
    const document = property.documents.id(documentId);
    if (!document) {
      return res.status(404).send("Document not found");
    }
    document.isVerified = status;
    const savedDocument = await document.save({ suppressWarning: true });
    const savedProperty = await property.save();
    const data = {
      _id: savedDocument._id,
      name: savedDocument.name,
      url: savedDocument.url,
      isVerified: savedDocument.isVerified,
      propertyId: savedProperty._id,
    };
    res.status(200).send(data);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//@desc  Verify a video
//@route PUT /:propertyId/videos/:videoId/status"
const verifyVideo = async (req, res) => {
  const { status } = req.body;
  if (status !== "pending" && status !== "success" && status !== "fail") {
    return res.status(404).send({
      message: "Status value must be 'pending' or 'success' or 'fail'",
    });
  }
  const { propertyId, videoId } = req.params;

  try {
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).send("Property not found");
    }
    const video = property.videos.id(videoId);
    if (!video) {
      return res.status(404).send("Video not found");
    }
    video.isVerified = status;
    const savedVideo = await video.save({ suppressWarning: true });
    const savedProperty = await property.save();
    const data = {
      _id: savedVideo._id,
      name: savedVideo.name,
      url: savedVideo.url,
      isVerified: savedVideo.isVerified,
      propertyId: savedProperty._id,
    };
    res.status(200).send(data);
  } catch (err) {
    res.status(500).send(err.message);
  }
};
//@desc  Verify an image
//@route PUT /:propertyId/images/:imageId/status"
const verifyImage = async (req, res) => {
  const { status } = req.body;
  if (status !== "pending" && status !== "success" && status !== "fail") {
    return res.status(404).send({
      message: "Status value must be 'pending' or 'success' or 'fail'",
    });
  }
  const { propertyId, imageId } = req.params;

  try {
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).send("Property not found");
    }
    const image = property.images.id(imageId);
    if (!image) {
      return res.status(404).send("Image not found");
    }
    image.isVerified = status;
    const savedImage = await image.save({ suppressWarning: true });
    const savedProperty = await property.save();
    const data = {
      _id: savedImage._id,
      name: savedImage.name,
      url: savedImage.url,
      isVerified: savedImage.isVerified,
      propertyId: savedProperty._id,
    };
    res.status(200).send(data);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

module.exports = {
  uploadS3,
  upload,
  uploadAll,
  search,
  createNewEstates,
  editProperty,
  getRealEstates,
  getRealEstate,
  getRealEstatesUpcomingAuctions,
  getRealEstatesOngoingAuctions,
  getRealEstatesStatusBuyer,
  approveProperty,
  verifyDocument,
  verifyImage,
  verifyVideo,
};
