const Auction = require("../model/Auction");
const Property = require("../model/Property");
const Buyer = require("../model/User");

//@desc  Create an auction
//@route POST admin/api/auctions/  body:{registerStartDate,registerEndDate,auctionStartDate,auctionEndDate,startingBid,incrementBid}  all dates are in ISOString format

const createAuction = async (req, res) => {
  try {
    const {
      registerStartDate: registerStartDateISOString,
      registerEndDate: registerEndDateISOString,
      auctionStartDate: auctionStartDateISOString,
      auctionEndDate: auctionEndDateISOString,
      startingBid,
      incrementAmount,
    } = req.body;
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
////@desc  Get information of current auction
//@route GET /api/auctions/:id
const getCurrentAuction = async (req, res) => {
  try {
    const auction = await Auction.findOne({ _id: req.params.id });
    if (!auction) {
      res.status(400).send("Auction for this property is not found");
    }
    const property = await Property.findOne({ propertyId: auction.propertyId });
    let numberOfBids = auction.bids.length;
    let highestBidders;
    if (numberOfBids !== 0) {
      highestBidders = auction.bids
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);
    }
    const result = {
      _id: auction._id,
      startingBid: auction.startingBid,
      incrementAmount: auction.incrementAmount,
      highestBid: auction.highestBid,
      registerStartDate: auction.registerStartDate,
      registerEndDate: auction.registerEndDate,
      auctionStartDate: auction.auctionStartDate,
      auctionEndDate: auction.auctionEndDate,
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
    if (buyer.isApproved) {
      res.status(400).send("User is not approved to bid yet");
    }
    const auction = await Auction.findOne({ _id: auctionId });
    const property = await Property.findOne({ _id: auction.propertyId });
    if (biddingTime.getTime() < auction.auctionStartDate.getTime()) {
      return res.status(400).send("Auction is not started yet");
    }
    if (biddingTime.getTime() > auction.auctionEndDate.getTime()) {
      return res.status(400).send("Auction was already ended");
    }
    if (biddingPrice <= auction.highestBid) {
      return res
        .status(400)
        .send("Bidding price is less than or equal to highest bid");
    }
    if (biddingPrice < auction.highestBid + auction.incrementAmount) {
      return res.status(400).send("Increment amount is less than the ");
    }
    const newBidder = {
      userId: req.user.userId,
      amount: biddingPrice,
      time: biddingTime,
    };
    auction.bids.push(newBidder);
    auction.highestBid = biddingPrice;
    const savedAuction = await auction.save();
    const result = {
      _id: savedAuction._id,
      bidderId: `BID${req.user.userId}`,
      startingBid: savedAuction.startingBid,
      incrementAmount: savedAuction.incrementAmount,
      highestBid: savedAuction.highestBid,
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
        reservedAmount: property.reservedAmount,
      },
    };
    res.status(200).send(result);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

module.exports = { createAuction, getCurrentAuction, placeBidding };
