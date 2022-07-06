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
        isFeatured,
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
        isFeatured,
      });
      const savedAuction = await newAuction.save();

      let email = property.createdBy.email;
      let subject = "Auction3 - Create an auction for your property";
      let text = `We create an auction for your property with starting register date ${registerStartDate} and auction start date ${auctionStartDate}.
      Starting bid is ${startingBid} and increment amount is ${incrementAmount}
       `;
      sendEmail({ to: email, subject, text });
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
      isFeatured,
    } = req.body;
    const bodySchema = Joi.object({
      registerStartDate: Joi.date().iso().optional(),
      registerEndDate: Joi.date().iso().optional(),
      auctionStartDate: Joi.date().iso().optional(),
      auctionEndDate: Joi.date().iso().optional(),
      startingBid: Joi.number().min(0).optional(),
      incrementAmount: Joi.number().min(0).optional(),
      isFeatured: Joi.boolean().optional(),
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
    auction.isFeatured = isFeatured || auction.isFeatured;
    const updatedAuction = await auction.save();
    res.status(200).send(updatedAuction);
  } catch (err) {
    res.status(500).send(err);
  }
};

//@desc  Delete an auction
//@route DELETE api/auctions/:id   //should check this, how about related seller and buyer info
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
//@route GET /api/auctions?isFeatured=..& isSold=..& time=... type=... &real_estate_type=...&min_price=...&max_price=...&condition=..
// &min_mileage=.. & max_mileage=..
const getAllAuctions = async (req, res) => {
  try {
    const querySchema = Joi.object({
      registerStartDate: Joi.date().iso().optional(),
      registerEndDate: Joi.date().iso().optional(),
      auctionStartDate: Joi.date().iso().optional(),
      auctionEndDate: Joi.date().iso().optional(),
      // startingBid: Joi.number().min(0).optional(),
      // incrementAmount: Joi.number().min(0).optional(),
      time: Joi.string().optional().valid("ongoing", "upcoming", "completed"),
      isFeatured: Joi.boolean().optional(),
      isSold: Joi.boolean().optional(),
      min_price: Joi.number().optional(),
      max_price: Joi.number().optional(),
      type: Joi.string().optional(),
      real_estate_type: Joi.string()
        .optional()
        .valid(
          "house",
          "villa",
          "estate",
          "country_house",
          "finca",
          "chalet",
          "townhouse",
          "bungalow",
          "apartment",
          "penhouse",
          "condo",
          "co_op",
          "land",
          "castle",
          "chateau",
          "farm_ranch",
          "private_island"
        ),
      property_zip_code: Joi.string().optional(),
      property_city: Joi.string().optional(),
      property_state: Joi.string().optional(),
      property_country: Joi.string().optional(),
      condition: Joi.string().optional().valid("used", "new"),
      make: Joi.string().optional(),
      model: Joi.string().optional(),
      min_mileage: Joi.number().optional(),
      max_mileage: Joi.number().optional(),
      manufacture_name: Joi.string().optional(),
      length: Joi.number().optional(),
    });

    const {
      // registerStartDate,
      // registerEndDate,
      // auctionStartDate,
      // auctionEndDate,
      time,
      isFeatured,
      isSold,
      min_price,
      max_price,
      type,
      real_estate_type,
      property_zip_code,
      property_city,
      property_state,
      property_country,
      condition,
      make,
      model,
      min_mileage,
      max_mileage,
      manufacture_name,
      min_length,
      max_length,
      aircraft_builder_name,
      year_built,
    } = req.query;

    const { error } = querySchema.validate(req.query);
    if (error) {
      return res.status(200).send({ error: error.details[0].message });
    }

    let auctions;
    let filter = {};
    let filterProperty = {};
    const now = new Date();

    if (isFeatured === "true") {
      filter.isFeatured = true;
    }
    if (isFeatured === "false") {
      filter.isFeatured = false;
    }
    if (time === "ongoing") {
      filter.auctionStartDate = { $lte: now };
      filter.auctionEndDate = { $gte: now };
    }
    if (time === "upcoming") {
      filter.auctionStartDate = { $gte: now };
    }
    if (time === "completed") {
      filter.auctionEndDate = { $lte: now };
    }
    if (min_price) {
      filter.startingBid = { $gt: parseInt(min_price) };
    }
    if (max_price) {
      filter.startingBid = filter.startingBid
        ? { ...filter.startingBid, $lt: parseInt(max_price) }
        : { $lt: parseInt(max_price) };
    }
    if (type) {
      filterProperty["property.type"] = type;
    }
    if (real_estate_type) {
      filterProperty["property.details.real_estate_type"] = real_estate_type;
    }
    if (property_zip_code) {
      filterProperty["property.details.property_address.zip_code"] =
        property_zip_code;
    }
    if (property_city) {
      filterProperty["property.details.property_address.city"] = property_city;
    }
    if (property_state) {
      filterProperty["property.details.property_address.state"] =
        property_state;
    }
    if (property_country) {
      filterProperty["property.details.property_address.country"] =
        property_country;
    }

    if (condition) {
      filterProperty["property.details.condition"] = condition;
    }
    if (make) {
      filterProperty["property.details.make"] = make;
    }
    if (model) {
      filterProperty["property.details.model"] = model;
    }
    if (min_mileage) {
      filterProperty["property.details.mileage"] = {
        $gte: parseInt(min_mileage),
      };
    }
    if (max_mileage) {
      filterProperty["property.details.mileage"] = filterProperty[
        "property.details.mileage"
      ]
        ? {
            ...filterProperty["property.details.mileage"],
            $lte: parseInt(max_mileage),
          }
        : { $lte: parseInt(max_mileage) };
    }
    if (manufacture_name) {
      filterProperty["property.details.manufacture_name"] = manufacture_name;
    }
    if (min_length) {
      filterProperty["property.details.length"] = {
        $gte: parseInt(min_length),
      };
    }
    if (max_length) {
      filterProperty["property.details.length"] = {
        $gte: parseInt(max_length),
      };
    }
    if (aircraft_builder_name) {
      filterProperty["property.details.aircraft_builder_name"] =
        aircraft_builder_name;
    }
    if (year_built) {
      filterProperty["property.details.year_built"] = year_built;
    }

    if (req.admin?.roles.includes("auction_read")) {
      auctions = await Auction.find(filter).populate({
        path: "property",
        select:
          "type createdBy details.owner_name details.property_address images.url",
        populate: { path: "createdBy", select: "userName" },
      }); //should add filter by property as well.

      if (isSold === "true") {
        auctions = auctions.filter((auction) => {
          return auction.winner.userId;
        });
        auctions = await Promise.all(
          auctions.map(async (auction) => {
            const user = await User.findById(auction.winner.userId);
            return {
              ...auction.toObject(),
              winner: {
                userId: user._id,
                amount: auction.winner.amount,
                time: auction.winner.time,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
              },
            };
          })
        );
      }
      return res.status(200).send(auctions);
    }

    auctions = await Auction.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: "properties",
          localField: "property",
          foreignField: "_id",
          as: "property",
          pipeline: [
            {
              $project: {
                _id: "$_id",
                type: "$type",
                details: "$details",
                images: "$images",
              },
            },
          ],
        },
      },
      { $unwind: { path: "$property" } },
      { $match: filterProperty },
      {
        $unset:
          time === "completed"
            ? ["incrementAmount", "bids"]
            : ["incrementAmount", "winner", "bids"],
      },
    ]);

    return res.status(200).send(auctions);
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
    let auction;

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

//@desc  Buyer do bidding  //should money back to bidder's wallet
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
    let subject = "Auction3- Bidding completed successfully";
    let text = `Hi ${user.firstName} ${user.lastName} Thank you for your bid. Your price is highest with ${biddingPrice} at ${biddingTime}`;
    sendEmail({ to: email, subject, text });

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
//@route GET /api/auctions/:id/result
const getAuctionResult = async (req, res) => {
  try {
    let email, subject, text;
    const auction = await Auction.findOne({ _id: req.params.id })
      .populate({
        path: "property",
        populate: {
          path: "createdBy",
          select: "_id firstName lastName email userName",
        },
        select: "_id type createdBy details reservedAmount discussedAmount",
      })
      .select("_id auctionStartDate auctionEndDate bids winner");
    if (!auction) {
      return res.status(200).send({ error: "Auction not found!" });
    }

    // auction has been set a winner
    if (auction.winner.userId) {
      let user = await User.findOne({ _id: auction.winner.userId });
      return res.status(200).send({
        _id: auction._id,
        winner: { userName: user.userName, amount: auction.winner.amount },
      });
    }

    // Auction has not ended yet
    if (auction.auctionEndDate.getTime() > new Date().getTime()) {
      return res.status(200).send({
        _id: auction._id,
        winner: null,
        message: "Auction has not ended!",
      });
    }

    let highestBidder = auction.bids.slice(-1)[0];

    // There is no winner at this auction
    if (
      highestBidder === undefined ||
      highestBidder.amount < auction.property.discussedAmount
    ) {
      email = auction.property.createdBy.email;
      subject = `Auction3- Auction for your property with number ${auction.property._id} ended`;
      text = `Hi ${auction.property.createdBy.firstName} ${auction.property.createdBy.lastName} Your property with number ${auction.property._id} has not been sold because no one has bid more than discussed amount`;
      return res.status(200).send({
        _id: auction._id,
        winner: null,
        message: "No winner at this auction",
      });
    }
    if (highestBidder.amount >= auction.property.reservedAmount) {
      auction.winner = {
        userId: highestBidder.userId,
        amount: highestBidder.amount,
      };
      const savedAuction = await auction.save();
      const user = await User.findById(savedAuction.winner.userId);
      //send email
      email = user.email;
      subject = "Auction3- Congratulation for winning an auction";
      text = `Congratulation for winning auction for property with id number ${auction.property._id}`;
      sendEmail({ to: email, subject, text });

      email = auction.property.createdBy.email;
      subject = "Auction3 - Your property has been successfully sold";
      text = `Your property with id number ${property._id} has been sold to ${user.userName} with price ${highestBidder.amount}`;
      sendEmail({ to: email, subject, text });

      return res.status(200).send({
        _id: savedAuction.id,
        winner: {
          userName: user.userName,
          amount: savedAuction.winner.amount,
        },
      });
    }

    //should check this one more time
    //send email to bidders between disscussedAmount and reservedAmount
    let discussedBidders = auction.bids.filter(
      (item) => item.amount >= auction.property.discussedAmount
    );
    if (discussedBidders.length !== 0) {
      for (let item of discussedBidders) {
        const user = await User.findById(item.userId);
        let email = user.email;
        let subject = "Auction3- Discuss auction price";
        let text = `Thank you for bidding for real-estate with id number ${auction._id}. Your bid is ${item.amount} is not met reserved amount. However, our seller is willing to discuss more about the price.`;
        sendEmail({ to: email, subject, text });
      }
    }
    res.status(200).send({
      _id: auction._id,
      winner: null,
      highestBidder,
      reservedAmount: auction.property.reservedAmount,
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
