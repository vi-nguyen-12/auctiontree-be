const Joi = require("joi").extend(require("@joi/date"));
const Auction = require("../model/Auction");
const Property = require("../model/Property");
const Buyer = require("../model/Buyer");
const User = require("../model/User");
const { sendEmail, getBidsInformation } = require("../helper");

//@desc  Create an auction
//@route POST api/auctions/  body:{propertyId, registerStartDate,registerEndDate,auctionStartDate,auctionEndDate,startingBid,incrementAmount}  all dates are in ISOString format

const createAuction = async (req, res) => {
  const {
    propertyId,
    registerStartDate: registerStartDateISOString,
    registerEndDate: registerEndDateISOString,
    auctionStartDate: auctionStartDateISOString,
    auctionEndDate: auctionEndDateISOString,
    startingBid,
    incrementAmount,
  } = req.body;

  try {
    const isPropertyInAuction = await Auction.findOne({ property: propertyId });
    if (isPropertyInAuction) {
      return res
        .status(200)
        .send({ error: "This property is already created for auction" });
    }

    const registerStartDate = new Date(registerStartDateISOString);
    const registerEndDate = new Date(registerEndDateISOString);
    const auctionStartDate = new Date(auctionStartDateISOString);
    const auctionEndDate = new Date(auctionEndDateISOString);
    const property = await Property.findOne({
      _id: propertyId,
    }).populate("createdBy docusignId");

    if (!property) {
      return res.status(200).send({ error: "Property not found" });
    }
    if (property.isApproved !== "success") {
      return res.status(200).send({ error: "Property is not approved" });
    }

    if (registerStartDate.getTime() >= registerEndDate.getTime()) {
      return res.status(200).send({
        error:
          "Register end time is earlier than or equal to register start time",
      });
    }

    // if (auctionStartDate.getTime() >= auctionEndDate.getTime()) {
    //   return res.status(200).send({
    //     error:
    //       "Auction end time is earlier than or equal to auction start time",
    //   });
    // }
    const newAuction = new Auction({
      property: property._id,
      registerStartDate,
      registerEndDate,
      auctionStartDate,
      auctionEndDate,
      startingBid,
      incrementAmount,
    });
    const savedAuction = await newAuction.save();

    let email = property.createdBy.email;
    let subject = "Auction10X - Create an auction for your property";
    let text = `We create an auction for your property with starting register date ${registerStartDate} and auction start date ${auctionStartDate}.
    Starting bid is ${startingBid} and increment amount is ${incrementAmount}
     `;
    sendEmail({ email, subject, text });
    res.status(200).send(savedAuction);
  } catch (err) {
    res.status(500).send(err);
  }
};

//@desc  Edit an auction
//@route PUT api/auctions/:id  body:{propertyId, registerStartDate,registerEndDate,auctionStartDate,auctionEndDate,startingBid,incrementAmount}  all dates are in ISOString format

const editAuction = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id).populate("property");
    if (!auction) return res.status(200).send({ error: "Auction not found!" });
    const {
      registerStartDate: registerStartDateISOString,
      registerEndDate: registerEndDateISOString,
      auctionStartDate: auctionStartDateISOString,
      auctionEndDate: auctionEndDateISOString,
      startingBid,
      incrementAmount,
    } = req.body;
    const bodySchema = {
      registerStartDate: Joi.date().iso(),
      registerEndDate: Joi.date().iso(),
      auctionStartDate: Joi.date().iso(),
      auctionEndDate: Joi.date().iso(),
      startingBid: Joi.number().min(0),
      incrementAmount: Joi.number().min(0),
    };
    const { error } = Joi.validate(req.body, bodySchema);
    if (error) {
      return res.status(200).send({ error: error.details[0].message });
    }
    const registerStartDate = registerStartDateISOString
      ? new Date(registerStartDateISOString)
      : auction.registerStartDate;
    const registerEndDate = registerEndDateISOString
      ? new Date(registerEndDateISOString)
      : auction.registerEndDate;
    const auctionStartDate = auctionStartDateISOString
      ? new Date(auctionStartDateISOString)
      : auction.auctionStartDate;
    const auctionEndDate = auctionEndDateISOString
      ? new Date(auctionEndDateISOString)
      : auction.auctionEndDate;
    if (!auction.property.isApproved) {
      return res.status(200).send({ error: "Property is not approved" });
    }
    if (registerStartDate.getTime() >= registerEndDate.getTime()) {
      return res.status(200).send({
        error:
          "Register end time is earlier than or equal to register start time",
      });
    }
    if (auctionStartDate.getTime() >= auctionEndDate.getTime()) {
      return res.status(200).send({
        error:
          "Auction end time is earlier than or equal to auction start time",
      });
    }
    // if (registerEndDate.getTime() > auctionStartDate.getTime()) {
    //   return res.status(200).send({
    //     error: "Auction start time is earlier than register end time",
    //   });
    // }

    auction.registerStartDate = registerStartDate;
    auction.registerEndDate = registerEndDate;
    auction.auctionStartDate = auctionStartDate;
    auction.auctionEndDate = auctionEndDate;
    auction.startingBid = startingBid || auction.startingBid;
    auction.incrementAmount = incrementAmount || auction.incrementAmount;
    console.log(auction);
    const updatedAuction = await auction.save();
    res.status(200).send(updatedAuction);
  } catch (err) {
    res.status(500).send(err);
  }
};

//@desc  Delete an auction
//@route DELETE api/auctions/:id
const deleteAuction = async (req, res) => {
  const auction = await Auction.findById(req.params.id);
  if (!auction) return res.status(200).send({ error: "Auction not found!" });
  try {
    await Auction.deleteOne({ _id: auction._id });
    res.status(204).send({ message: "Auction deleted successfully" });
  } catch (err) {
    res.status(500).send(err.message);
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
      auction = await Auction.findOne({ property: req.params.propertyId });
    } else {
      auction = await Auction.findOne({ _id: req.params.id });
    }
    if (!auction) {
      return res
        .status(200)
        .send({ error: "Auction for this property is not found" });
    }
    const property = await Property.findOne({ _id: auction.property });
    const { numberOfBids, highestBid, highestBidders } =
      await getBidsInformation(auction.bids, auction.startingBid);
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

//@desc  Get upcoming auctions
//@route GET /api/auctions/upcoming
const getUpcomingAuctions = async (req, res) => {
  try {
    const now = new Date();
    const allAuctions = await Auction.find({
      auctionStartDate: { $gte: now },
    })
      .populate("property")
      .sort({ auctionStartDate: 1 });

    const data = allAuctions.map((auction) => {
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
//@desc  Get ongoing auctions
//@route GET /api/auctions/ongoing
const getOngoingAuctions = async (req, res) => {
  try {
    const now = new Date();
    const allAuctions = await Auction.find({
      auctionStartDate: { $lte: now },
      auctionEndDate: { $gte: now },
    }).sort({ auctionStartDate: 1 });

    for (let auction of allAuctions) {
      const property = await Property.findOne({ _id: auction.property });
      const { numberOfBids, highestBid, highestBidders } =
        await getBidsInformation(auction.bids, auction.startingBid);
      auction.property = property;
      auction.numberOfBids = numberOfBids;
      auction.highestBid = highestBid;
      auction.highestBidders = highestBidders;
    }
    const data = allAuctions.map((auction) => {
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

//@desc  Get upcoming auctions for a specific type
//@route GET /api/auctions/real-estate/upcoming
//@route GET /api/auctions/car/upcoming
//@route GET /api/auctions/yacht/upcoming
//@route GET /api/auctions/jet/upcoming
const getUpcomingAuctionsOfSpecificType = async (req, res) => {
  try {
    const type = req.originalUrl.split("/")[3];
    const now = new Date();
    const allAuctions = await Auction.find({
      auctionStartDate: { $gte: now },
    })
      .populate("property")
      .sort({ auctionStartDate: 1 });

    const data = allAuctions
      .filter((auction) => {
        return auction.property.type === type;
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

//@desc  Get ongoing auctions for a specific type
//@route GET /api/auctions/real-estate/ongoing
//@route GET /api/auctions/car/ongoing
//@route GET /api/auctions/yacht/ongoing
//@route GET /api/auctions/jet/ongoing
const getOngoingAuctionsOfSpecificType = async (req, res) => {
  try {
    const type = req.originalUrl.split("/")[3];
    const now = new Date();
    const allAuctions = await Auction.find({
      auctionStartDate: { $lte: now },
      auctionEndDate: { $gte: now },
    }).sort({ auctionStartDate: 1 });

    for (let auction of allAuctions) {
      const property = await Property.findOne({ _id: auction.property });
      const { numberOfBids, highestBid, highestBidders } =
        await getBidsInformation(auction.bids, auction.startingBid);
      auction.property = property;
      auction.numberOfBids = numberOfBids;
      auction.highestBid = highestBid;
      auction.highestBidders = highestBidders;
    }
    const data = allAuctions
      .filter((auction) => {
        return auction.property.type === type;
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
//@route GET /api/auctions/real-estate/status?buyer=true
const getRealEstateAuctionsStatusBuyer = async (req, res) => {
  const { buyer } = req.query;
  if (!buyer) {
    return res
      .status(200)
      .send({ error: "Please specify if user is buyer or seller" });
  }
  try {
    const registeredList = await Buyer.find({ userId: req.user.userId });
    let data = [];
    if (registeredList.length !== 0) {
      for (let item of registeredList) {
        const auction = await Auction.findOne({ _id: item.auctionId });
        const property = await Property.findOne({ _id: auction.property });
        item.auction = auction;
        item.property = property;
      }
      data = registeredList.map((item) => {
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
    }
    res.status(200).send(data);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//@desc  Buyer do bidding
//@route PUT /api/auctions/bidding/:id   body:{biddingTime, biddingPrice }
const placeBidding = async (req, res) => {
  const bodySchema = Joi.object({
    biddingTime: Joi.date().iso().required(),
    biddingPrice: Joi.number().required().strict(),
  });
  const { error } = bodySchema.validate(req.body);
  if (error) return res.status(200).send({ error: error.details[0].message });

  const auctionId = req.params.id;
  const { biddingTime: biddingTimeISOString, biddingPrice } = req.body;
  const biddingTime = new Date(biddingTimeISOString);
  try {
    const buyer = await Buyer.findOne({ userId: req.user.userId, auctionId });
    const user = await User.findById(req.user.userId);
    if (!buyer) {
      return res.status(200).send({ error: "User did not register to buy" });
    }

    if (buyer.isApproved !== "success") {
      return res.status(200).send({ error: "User is not approved to bid yet" });
    }

    const auction = await Auction.findOne({ _id: auctionId });
    if (!auction) {
      return res.status(200).send({ error: "Auction not found" });
    }

    const property = await Property.findOne({ _id: auction.property });

    if (user.wallet < biddingPrice) {
      return res.status(200).send({ error: "Wallet is insufficient to bid" });
    }

    //check bidding time
    if (biddingTime.getTime() < auction.auctionStartDate.getTime()) {
      return res.status(200).send({ error: "Auction is not started yet" });
    }
    if (biddingTime.getTime() > auction.auctionEndDate.getTime()) {
      return res.status(200).send({ error: "Auction has now ended" });
    }

    //check bidding price
    let highestBid =
      auction.bids.length === 0
        ? auction.startingBid
        : auction.bids.slice(-1)[0].amount;
    if (biddingPrice <= highestBid) {
      return res
        .status(200)
        .send({ error: "Bidding price must be greater than highest bid" });
    }
    if (biddingPrice < highestBid + auction.incrementAmount) {
      return res.status(200).send({
        error: "Bidding price is less than the minimum bid increment",
      });
    }

    //deduct amount from wallet;
    user.wallet = user.wallet - biddingPrice;
    await user.save();

    //add money back to wallet of 4th highest bidder;
    if (auction.bids.length > 3) {
      const fourthHighestBidder = auction.bids.slice(-4)[0];
      const fourthHighestBidderUser = await User.findById(
        fourthHighestBidder.userId
      );
      fourthHighestBidderUser.wallet =
        fourthHighestBidderUser.wallet + fourthHighestBidder.amount;
      await fourthHighestBidderUser.save();
    }
    //send email;
    let email = user.email;
    let subject = "Auction10X- Bidding completed successfully";
    let text = `Hi ${user.firstName} ${user.lastName} Thank you for your bid. Your price is highest with ${biddingPrice} at ${biddingTime}`;
    sendEmail({ email, subject, text });

    const newBidder = {
      userId: req.user.userId,
      amount: biddingPrice,
      time: biddingTime,
    };
    auction.bids.push(newBidder);

    const savedAuction = await auction.save();
    let numberOfBids, highestBidders;
    ({ numberOfBids, highestBid, highestBidders } = await getBidsInformation(
      savedAuction.bids,
      savedAuction.startingBid
    ));
    let isReservedMet = highestBid >= property.reservedAmount;

    const result = {
      _id: savedAuction._id,
      startingBid: savedAuction.startingBid,
      highestBid,
      numberOfBids,
      highestBidders,
      isReservedMet,
      propertyId: property._id,
    };

    req.io.emit("bid", {
      auctionId: savedAuction._id,
      highestBid,
      numberOfBids,
      highestBidders,
      isReservedMet,
    });
    res.status(200).send(result);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//@desc Get result of auction
//@route GET /api/auctions/result/:id
const getAuctionResult = async (req, res) => {
  try {
    const auction = await Auction.findOne({ _id: req.params.id });
    if (!auction) {
      return res.status(200).send({ error: "Auction not found!" });
    }

    if (auction.winner.userId) {
      let user = await User.findOne({ _id: auction.winner.userId });
      return res.status(200).send({
        _id: auction._id,
        winner: { userName: user.userName, amount: auction.winner.amount },
      });
    }

    if (auction.auctionEndDate.getTime() > new Date().getTime()) {
      return res.status(200).send({
        _id: auction._id,
        winner: null,
        message: "Auction has not ended!",
      });
    }

    if (auction.bids.length === 0) {
      return res.status(200).send({
        _id: auction._id,
        winner: null,
        message: "No one bids at this auction",
      });
    }
    const property = await Property.findOne({ _id: auction.property });
    let highestBidder = auction.bids.slice(-1)[0];

    if (highestBidder.amount >= property.reservedAmount) {
      auction.winner = {
        userId: highestBidder.userId,
        amount: highestBidder.amount,
      };
      const savedAuction = await auction.save();
      const user = await User.findById(savedAuction.winner.userId);
      //send email
      let email = user.email;
      let subject = "Auction10X- Congratulation for winning an auction";
      let text = `Congratulation for winning auction for property with id number ${property._id}`;
      sendEmail({ email, subject, text });

      return res.status(200).send({
        _id: savedAuction.id,
        winner: {
          userName: user.userName,
          amount: savedAuction.winner.amount,
        },
      });
    }

    //send email to bidders between disscussedAmount and reservedAmount
    let discussedBidders = auction.bids.filter(
      (item) => item.amount >= property.discussedAmount
    );
    if (discussedBidders.length !== 0) {
      for (let item of discussedBidders) {
        const user = await User.findById(item.userId);
        let email = user.email;
        let subject = "Auction10X- Discuss auction price";
        let text = `Thank you for bidding for real-estate with id number ${property._id}. Your bid is ${item.amount} is not met reserved amount. However, our seller is willing to discuss more about the price.`;

        sendEmail({ email, subject, text });
      }
    }
    res.status(200).send({
      _id: auction._id,
      winner: null,
      highestBidder,
      reservedAmount: property.reservedAmount,
      message: "Reserved not met",
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

module.exports = {
  createAuction,
  getAuction,
  placeBidding,
  getUpcomingAuctions,
  getOngoingAuctions,
  getUpcomingAuctionsOfSpecificType,
  getOngoingAuctionsOfSpecificType,
  getRealEstateAuctionsStatusBuyer,
  getAuctionResult,
  editAuction,
  deleteAuction,
};
