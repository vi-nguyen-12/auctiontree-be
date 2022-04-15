const Joi = require("joi").extend(require("@joi/date"));
const Auction = require("../model/Auction");
const Property = require("../model/Property");
const Buyer = require("../model/Buyer");
const User = require("../model/User");
const { sendEmail, getBidsInformation } = require("../helper");

//@desc  Create an auction
//@route POST api/auctions/  body:{propertyId, registerStartDate,registerEndDate,auctionStartDate,auctionEndDate,startingBid,incrementAmount}  all dates are in ISOString format

const createAuction = async (req, res) => {
  try {
    if (req.admin?.roles.includes("auction_create")) {
      const {
        propertyId,
        registerStartDate: registerStartDateISOString,
        registerEndDate: registerEndDateISOString,
        auctionStartDate: auctionStartDateISOString,
        auctionEndDate: auctionEndDateISOString,
        startingBid,
        incrementAmount,
      } = req.body;
      const isPropertyInAuction = await Auction.findOne({
        property: propertyId,
      });
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

      if (registerEndDate.getTime() >= auctionEndDate.getTime()) {
        return res.status(200).send({
          error:
            "Auction end time is earlier than or equal to register end time",
        });
      }

      if (auctionStartDate.getTime() >= auctionEndDate.getTime()) {
        return res.status(200).send({
          error:
            "Auction end time is earlier than or equal to auction start time",
        });
      }
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
      return res.status(200).send(savedAuction);
    }
    res.status(200).send({ error: "Not allowed to create auction" });
  } catch (err) {
    res.status(500).send(err);
  }
};

//@desc  Edit an auction
//@route PUT api/auctions/:id  body:{propertyId, registerStartDate,registerEndDate,auctionStartDate,auctionEndDate,startingBid,incrementAmount}  all dates are in ISOString format

const editAuction = async (req, res) => {
  try {
    if (!req.admin || !req.admin.roles.includes("auction_edit")) {
      return res.status(200).send({ error: "Not allowed to edit auction" });
    }
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
    const bodySchema = Joi.object({
      registerStartDate: Joi.date().iso().optional(),
      registerEndDate: Joi.date().iso().optional(),
      auctionStartDate: Joi.date().iso().optional(),
      auctionEndDate: Joi.date().iso().optional(),
      startingBid: Joi.number().min(0).optional(),
      incrementAmount: Joi.number().min(0).optional(),
    });
    const { error } = bodySchema.validate(req.body);
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
    if (registerEndDate.getTime() >= auctionEndDate.getTime()) {
      return res.status(200).send({
        error: "Auction end time is earlier than register end time",
      });
    }

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
  try {
    if (req.admin && req.admin.roles.includes("auction_delete")) {
      await Auction.deleteOne({ _id: req.params.id });
      return res.status(204).send({ message: "Auction deleted successfully" });
    }
    return res.status(200).send({ error: "Not allowed to delete auction" });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//@desc  Get all auctions
//@route GET /api/auctions
const getAllAuctions = async (req, res) => {
  try {
    if (req.admin?.roles.includes("auction_read")) {
      const auctions = await Auction.find().populate({
        path: "property",
        select:
          "type createdBy details.owner_name details.property_address images.url",
        populate: { path: "createdBy", select: "userName" },
      });
      return res.status(200).send(auctions);
    }
    res.status(200).send({ error: "Not allowed to view auctions" });
  } catch (err) {
    res.status(500).send(err);
  }
};

//@desc  Get information of auction
//@route GET /api/auctions/:id
//@route GET /api/auction/propertyId/:propertyId
const getAuction = async (req, res) => {
  try {
    const url = req.originalUrl;
    let auction, result;

    let filter = {};
    if (!url.includes("propertyId")) {
      filter["_id"] = req.params.id;
    } else {
      filter["property"] = req.params.propertyId;
    }

    auction = await Auction.findOne(filter).populate({
      path: "property",
      select: "-step -isApproved",
    });
    if (!auction) return res.status(200).send({ error: "Auction not found!" });
    const { numberOfBids, highestBid, highestBidders } = getBidsInformation(
      auction.bids,
      auction.startingBid
    );
    let isReservedMet =
      highestBid >= auction.property.reservedAmount ? true : false;
    auction = {
      ...auction.toObject(),
      numberOfBids,
      highestBid,
      highestBidders,
      isReservedMet,
    };

    //Authenticate: admin: view everything
    // Authenticate: owner of property: view everything and add 1 field: "isOwner": true
    if (req.admin?.roles.includes("auction_read")) {
      return res.status(200).send(auction);
    }
    if (
      req.user &&
      req.user.id.toString() === auction.property.createdBy.toString()
    ) {
      auction = {
        ...auction,
        isOwner: true,
      };
      return res.status(200).send(auction);
    }

    //Authenticate: registered buyer & be approved can see list top 5, not whole list of bids
    delete auction.bids;
    delete auction.property.reservedAmount;
    delete auction.property.discussedAmount;
    delete auction.property.docusignId;
    delete auction.property.createdAt;
    delete auction.property.updateAt;

    let userId = req.user?.id;
    let isRegisteredToBuy = await Buyer.findOne({
      auctionId: auction._id,
      userId,
    });
    if (isRegisteredToBuy?.isApproved === "success") {
      return res.status(200).send(auction);
    }
    //Authenticate: registered buyer not approved cannot see highestBidders and if reserved is met
    //Authenticate: normal user : the same and add 1 field: "isNotRegisteredToBuy": true
    delete auction.highestBidders;
    delete auction.isReservedMet;
    if (isRegisteredToBuy) {
      return res.status(200).send(auction);
    }
    auction.isNotRegisteredToBuy = true;
    return res.status(200).send(auction);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

//@desc  Get upcoming auctions
//@route GET /api/auctions/upcoming
//@route GET /api/auctions/upcoming/:type
const getUpcomingAuctions = async (req, res) => {
  try {
    const type = req.params.type;
    const now = new Date();
    let filter = { auctionStartDate: { $gte: now } };
    if (type) {
      filter["type"] = type;
    }
    let allAuctions = await Auction.find(filter)
      .populate({
        path: "property",
        match: type ? { type } : {},
        select:
          "-createdBy -discussedAmount -isApproved -step -docusignId -createdAt -updatedAt",
      })
      .sort({ auctionStartDate: 1 });
    allAuctions = allAuctions.filter((auction) => auction.property);
    res.status(200).send(allAuctions);
  } catch (err) {
    res.status(500).send(err.message);
  }
};
//@desc  Get ongoing auctions
//@route GET /api/auctions/ongoing
//@route GET /api/auctions/ongoing/:type
const getOngoingAuctions = async (req, res) => {
  try {
    let type = req.params.type;
    const now = new Date();
    let filter = {
      auctionStartDate: { $lte: now },
      auctionEndDate: { $gte: now },
    };

    if (type) {
      filter["type"] = type;
    }
    let allAuctions = await Auction.find(filter)
      .sort({ auctionStartDate: 1 })
      .populate({
        path: "property",
        match: type ? { type } : {},
        select:
          "-createdBy -discussedAmount -isApproved -step -docusignId -createdAt -updatedAt",
      });

    allAuctions = allAuctions
      .filter((auction) => auction.property)
      .map((auction) => {
        const { numberOfBids, highestBid, highestBidders } = getBidsInformation(
          auction.bids,
          auction.startingBid
        );
        let isReservedMet =
          highestBid >= auction.property.reservedAmount ? true : false;
        auction = {
          ...auction.toObject(),
          numberOfBids,
          highestBid,
          highestBidders,
          isReservedMet,
        };
        delete auction.bids;
        delete auction.property.reservedAmount;
        return auction;
      });
    res.status(200).send(allAuctions);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//@desc  Get status of auctions  which buyer register to buy
//@route GET /api/auctions/status?buyer=true
const getAuctionStatusOfABuyer = async (req, res) => {
  const { buyer } = req.query;
  if (!buyer) {
    return res
      .status(200)
      .send({ error: "Please specify if user is buyer or seller" });
  }
  try {
    const registeredList = await Buyer.find({ userId: req.user.id });
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
    const buyer = await Buyer.findOne({ userId: req.user.id, auctionId });
    const user = await User.findById(req.user.id);
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
      userId: req.user.id,
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
  getAuctionStatusOfABuyer,
  getAuctionResult,
  editAuction,
  deleteAuction,
  getAllAuctions,
};
