const Auction = require("../model/Auction");
const Property = require("../model/Property");
const Buyer = require("../model/Buyer");
const { getBidsInformation } = require("../helper");

//@desc  Create an auction
//@route POST admin/api/auctions/  body:{propertyId, registerStartDate,registerEndDate,auctionStartDate,auctionEndDate,startingBid,incrementAmount}  all dates are in ISOString format

const createAuction = async (req, res) => {
  try {
    const {
      propertyId,
      registerStartDate: registerStartDateISOString,
      registerEndDate: registerEndDateISOString,
      auctionStartDate: auctionStartDateISOString,
      auctionEndDate: auctionEndDateISOString,
      startingBid,
      incrementAmount,
    } = req.body;

    const isPropertyInAuction = await Auction.findOne({ propertyId });
    if (isPropertyInAuction) {
      return res
        .status(400)
        .send("This property is already created for auction");
    }

    const registerStartDate = new Date(registerStartDateISOString);
    const registerEndDate = new Date(registerEndDateISOString);
    const auctionStartDate = new Date(auctionStartDateISOString);
    const auctionEndDate = new Date(auctionEndDateISOString);

    const property = await Property.findOne({ _id: req.body.propertyId });
    if (!property) {
      return res.status(400).send("Property not found");
    }
    if (!property.isApproved) {
      return res.status(400).send("Property is not approved");
    }
    if (registerStartDate.getTime() >= registerEndDate.getTime()) {
      return res
        .status(400)
        .send(
          "Register end time is earlier than or equal to register start time"
        );
    }
    if (auctionStartDate.getTime() >= auctionEndDate.getTime()) {
      return res
        .status(400)
        .send(
          "Auction end time is earlier than or equal to auction start time"
        );
    }
    if (registerEndDate.getTime() > auctionStartDate.getTime()) {
      return res
        .status(400)
        .send("Auction start time is earlier than register end time");
    }
    const newAuction = new Auction({
      propertyId: property._id,
      registerStartDate,
      registerEndDate,
      auctionStartDate,
      auctionEndDate,
      startingBid,
      incrementAmount,
    });
    const savedAuction = await newAuction.save();
    res.status(200).send(savedAuction);
  } catch (err) {
    res.status(500).send(err);
  }
};
//@desc  Get information of auction
//@route GET /api/auctions/:id
//@route GET /api/auction/propertyId/:propertyId
const getAuction = async (req, res) => {
  const url = req.originalUrl;
  try {
    let auction;
    if (url.includes("propertyId")) {
      auction = await Auction.findOne({ propertyId: req.params.propertyId });
      console.log(auction);
    } else {
      auction = await Auction.findOne({ _id: req.params.id });
    }
    if (!auction) {
      res.status(400).send("Auction for this property is not found");
    }
    const property = await Property.findOne({ _id: auction.propertyId });
    const { numberOfBids, highestBid, highestBidders } = getBidsInformation(
      auction.bids,
      auction.startingBid
    );
    const result = {
      _id: auction._id,
      startingBid: auction.startingBid,
      incrementAmount: auction.incrementAmount,
      registerStartDate: auction.registerStartDate,
      registerEndDate: auction.registerEndDate,
      auctionStartDate: auction.auctionStartDate,
      auctionEndDate: auction.auctionEndDate,
      highestBid,
      numberOfBids,
      highestBidders,
      property: {
        _id: property._id,
        type: property.type,
        details: property.details,
        images: property.images,
        videos: property.videos,
        documents: property.documents,
        reservedAmount: property.reservedAmount,
      },
    };
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

//@desc  Get upcoming auctions for real-estate
//@route GET /api/auctions/real-estates/upcoming
const getUpcomingAuctionsOfRealEstates = async (req, res) => {
  try {
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
          _id: auction._id,
          registerStartDate: auction.registerStartDate,
          registerEndDate: auction.registerEndDate,
          auctionStartDate: auction.auctionStartDate,
          auctionEndDate: auction.auctionEndDate,
          startingBid: auction.startingBid,
          incrementAmount: auction.incrementAmount,
          property: {
            _id: auction.property._id,
            type: auction.property.type,
            details: auction.property.details,
            images: auction.property.images,
            videos: auction.property.videos,
            documents: auction.property.documents,
          },
        };
      });
    res.status(200).send(data);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//@desc  Get ongoing auctions for real-estate
//@route GET /api/auctions/real-estates/ongoing
const getOngoingAuctionsOfRealEstates = async (req, res) => {
  try {
    const now = new Date();
    const allAuctions = await Auction.find({
      auctionStartDate: { $lte: now },
      auctionEndDate: { $gte: now },
    });
    for (let auction of allAuctions) {
      const property = await Property.findOne({ _id: auction.propertyId });
      const { numberOfBids, highestBid, highesBidders } = getBidsInformation(
        auction.bids,
        auction.startingBid
      );
      auction.property = property;
      auction.numberOfBids = numberOfBids;
      auction.highestBid = highestBid;
      auction.highesBidders = highesBidders;
    }
    const data = allAuctions
      .filter((auction) => {
        return auction.property.type === "real-estate";
      })
      .map((auction) => {
        return {
          _id: auction._id,
          registerStartDate: auction.registerStartDate,
          registerEndDate: auction.registerEndDate,
          auctionStartDate: auction.auctionStartDate,
          auctionEndDate: auction.auctionEndDate,
          startingBid: auction.startingBid,
          incrementAmount: auction.incrementAmount,
          numberOfBids: auction.numberOfBids,
          highestBid: auction.highestBid,
          highestBidders: auction.highestBidders,
          property: {
            _id: auction.property._id,
            type: auction.property.type,
            details: auction.property.details,
            images: auction.property.images,
            videos: auction.property.videos,
            documents: auction.property.documents,
          },
        };
      });
    res.status(200).send(data);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//@desc  Get status of auctions  which buyer register to buy
//@route GET /api/auctions/real-estates/status?buyer=true
const getRealEstateAuctionsStatusBuyer = async (req, res) => {
  const { buyer } = req.query;
  if (!buyer) {
    return res.status(403).send("Please specify if user is buyer or seller");
  }
  try {
    console.log("test");
    console.log(req.user.userId);
    const registeredList = await Buyer.find({ userId: req.user.userId });
    console.log(registeredList);
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
        _id: item.auction._id,
        registerStartDate: item.auction.registerStartDate,
        registerEndDate: item.auction.registerEndDate,
        auctionStartDate: item.auction.auctionStartDate,
        auctionEndDate: item.auction.auctionEndDate,
        property: {
          _id: item.property._id,
          type: item.auction.type,
          details: item.property.details,
          images: item.property.images,
          videos: item.property.videos,
          documents: item.property.documents,
        },
        isApproved: item.isApproved,
      };
    });
    res.status(200).send(data);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//@desc  Buyer do bidding
//@route PUT /api/auctions/bidding/:id   body:{biddingTime, biddingPrice }
const placeBidding = async (req, res) => {
  const auctionId = req.params.id;
  const { biddingTime: biddingTimeISOString, biddingPrice } = req.body;
  const biddingTime = new Date(biddingTimeISOString);
  try {
    const buyer = await Buyer.findOne({ userId: req.user.userId });
    if (!buyer) {
      res.status(400).send("User did not register to buy");
    }
    if (!buyer.isApproved) {
      res.status(400).send("User is not approved to bid yet");
    }

    const auction = await Auction.findOne({ _id: auctionId });
    if (!auction) {
      return res.status(400).send("Auction not found");
    }

    const property = await Property.findOne({ _id: auction.propertyId });

    //check bidding time
    if (biddingTime.getTime() < auction.auctionStartDate.getTime()) {
      return res.status(400).send("Auction is not started yet");
    }
    if (biddingTime.getTime() > auction.auctionEndDate.getTime()) {
      return res.status(400).send("Auction was already ended");
    }

    //check bidding price
    let highestBid =
      auction.bids.length === 0 ? startingBid : auction.bids.pop().amount;
    if (biddingPrice <= highestBid) {
      return res
        .status(400)
        .send("Bidding price is less than or equal to highest bid");
    }
    if (biddingPrice < highestBid + auction.incrementAmount) {
      return res
        .status(400)
        .send("Bidding price is less than the minimum bid increment");
    }

    const newBidder = {
      userId: req.user.userId,
      amount: biddingPrice,
      time: biddingTime,
    };
    auction.bids.push(newBidder);

    const savedAuction = await auction.save();

    let numberOfBids = savedAuction.bids.length;
    const highestBidders = savedAuction.bids.slice(-5);
    highestBid = savedAuction.bids.pop().amount;

    const result = {
      _id: savedAuction._id,
      startingBid: savedAuction.startingBid,
      incrementAmount: savedAuction.incrementAmount,
      highestBid,
      registerStartDate: savedAuction.registerStartDate,
      registerEndDate: savedAuction.registerEndDate,
      auctionStartDate: savedAuction.auctionStartDate,
      auctionEndDate: savedAuction.auctionEndDate,
      numberOfBids,
      highestBidders,
      property: {
        _id: property._id,
        type: property.type,
        details: property.details,
        images: property.images,
        videos: property.videos,
        documents: property.documents,
      },
    };
    res.status(200).send(result);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//@desc Update and get result of auction
//@route PUT /api/auctions/result/:id
const updateAndGetAuctionResult = async (req, res) => {
  try {
    const auction = await Auction.findOne({ _id: req.params.id });
    if (!auction) {
      return res.status(404).send("Auction not found!");
    }
    const property = await Property.findOne({ _id: auction.propertyId });
    if (new Date().getTime() > auction.auctionEndDate.getTime()) {
      let highestBid =
        auction.bids.length === 0
          ? auction.startingBid
          : auction.bids.pop().amount;
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
};

module.exports = {
  createAuction,
  getAuction,
  placeBidding,
  getUpcomingAuctionsOfRealEstates,
  getOngoingAuctionsOfRealEstates,
  getRealEstateAuctionsStatusBuyer,
};
