const Joi = require("joi").extend(require("@joi/date"));
const Auction = require("../model/Auction");
const Property = require("../model/Property");
const Buyer = require("../model/Buyer");
const User = require("../model/User");
const {
  sendEmail,
  getBidsInformation,
  replaceEmailTemplate,
  getGeneralAdmins,
  addNotificationToAdmin,
} = require("../helper");

//@desc  Create an auction
//@route POST api/auctions/  body:{propertyId, registerStartDate,registerEndDate,auctionStartDate,auctionEndDate,startingBid,incrementAmount}  all dates are in ISOString format

const createAuction = async (req, res) => {
  try {
    if (req.admin?.permissions.includes("auction_create")) {
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
      let admins;
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
      const user = await User.findById(property.createdBy._id);

      if (user.isSuspended) {
        return res
          .status(200)
          .send({ error: "User has been suspended. Cannot create auction" });
      }

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
      let emailBody;
      emailBody = await replaceEmailTemplate("property_auction", {
        name: `${property.createdBy.firstName} ${property.createdBy.lastName}`,
        property_address: `${property.details.property_address.formatted_street_address} ${property.details.property_address.zip_code} ${property.details.property_address.city} ${property.details.property_address.state} ${property.details.property_address.country}`,
        auction_id: savedAuction._id,
        auction_registration_start_date: registerStartDate,
        auction_registration_end_date: registerEndDate,
        auction_start_date: auctionStartDate,
        auction_end_date: auctionEndDate,
        starting_bid_price: startingBid,
        increment_amount: incrementAmount,
      });
      if (emailBody.error) {
        return res.status(200).send({ error: emailBody.error });
      }
      sendEmail({
        to: property.createdBy.email,
        subject: emailBody.subject,
        htmlText: emailBody.content,
      });
      admins = await getGeneralAdmins();
      sendEmail({
        to: admins.map((admin) => admin.email),
        subject: "Auction Tree - New Auction is created",
        text: `A new auction has been created with id: ${savedAuction._id}. Please check this new auction in admin site`,
      });
      addNotificationToAdmin(admins, {
        propertyId,
        auctionId: savedAuction._id,
        message: `Property assigned to auction`,
      });

      user.notifications.push({
        propertyId,
        auctionId: savedAuction._id,
        message: `Property assigned to auction`,
      });
      await user.save();

      return res.status(200).send(savedAuction);
    }
    res.status(200).send({ error: "Not allowed to create auction" });
  } catch (err) {
    res.status(500).send(err);
  }
};

//@desc  Edit an auction
//@route PUT api/auctions/:id  body:{ registerStartDate,registerEndDate,auctionStartDate,auctionEndDate,startingBid,incrementAmount, isActive}  all dates are in ISOString format

const editAuction = async (req, res) => {
  try {
    if (!req.admin || !req.admin.permissions.includes("auction_edit")) {
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
      isActive,
    } = req.body;
    const bodySchema = Joi.object({
      registerStartDate: Joi.date().iso().optional(),
      registerEndDate: Joi.date().iso().optional(),
      auctionStartDate: Joi.date().iso().optional(),
      auctionEndDate: Joi.date().iso().optional(),
      startingBid: Joi.number().min(0).optional(),
      incrementAmount: Joi.number().min(0).optional(),
      isFeatured: Joi.boolean().optional(),
      isActive: Joi.boolean().optional(),
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
    if (isActive) {
      if (auction.property.isApproved !== "success") {
        return res.status(200).send({
          error: "Property is not approved",
        });
      }
    }

    auction.registerStartDate = registerStartDate;
    auction.registerEndDate = registerEndDate;
    auction.auctionStartDate = auctionStartDate;
    auction.auctionEndDate = auctionEndDate;
    auction.startingBid = startingBid || auction.startingBid;
    auction.incrementAmount = incrementAmount || auction.incrementAmount;
    auction.isFeatured = isFeatured || auction.isFeatured;
    auction.isActive = isActive || auction.isActive;
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
    if (req.admin && req.admin.permissions.includes("auction_delete")) {
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
// &min_mileage=.. & max_mileage=.. &page=...
const getAuctions = async (req, res) => {
  try {
    const querySchema = Joi.object({
      registerStartDate: Joi.date().iso().optional(),
      registerEndDate: Joi.date().iso().optional(),
      auctionStartDate: Joi.date().iso().optional(),
      auctionEndDate: Joi.date().iso().optional(),
      // startingBid: Joi.number().min(0).optional(),
      // incrementAmount: Joi.number().min(0).optional(),
      time: Joi.alternatives(
        Joi.string().valid("ongoing", "upcoming", "completed"),
        Joi.array().items(
          Joi.string().valid("ongoing", "upcoming", "completed")
        )
      ).optional(),

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
      property_formatted_street_address: Joi.string().optional(),
      property_zip_code: Joi.string().optional(),
      property_city: Joi.string().optional(),
      property_state: Joi.string().optional(),
      property_country: Joi.string().optional(),
      condition: Joi.string().optional().valid("used", "new"),
      make: Joi.string().optional(),
      model: Joi.string().optional(),
      min_mileage: Joi.number().optional(),
      max_mileage: Joi.number().optional(),
      manufacturer_name: Joi.string().optional(),
      length: Joi.number().optional(),
      isActive: Joi.boolean().optional(),
      page: Joi.string().regex(/^\d+$/).optional(),
      limit: Joi.string().regex(/^\d+$/).optional(),
    });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;

    let {
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
      property_formatted_street_address,
      property_zip_code,
      property_city,
      property_state,
      property_country,
      condition,
      make,
      model,
      min_mileage,
      max_mileage,
      manufacturer_name,
      min_length,
      max_length,
      aircraft_builder_name,
      year_built,
      isActive,
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
    if (time === "ongoing" || time?.includes("ongoing")) {
      filter.auctionStartDate = { $lte: now };
      filter.auctionEndDate = { $gte: now };
    }
    if (time === "upcoming" || time?.includes("upcoming")) {
      filter.auctionStartDate = { $gte: now };
    }
    if (time === "completed" || time?.includes("completed")) {
      filter.auctionEndDate = { $lte: now };
    }

    if (min_price) {
      filter.startingBid = { $gte: parseInt(min_price) };
    }
    if (max_price) {
      filter.startingBid = filter.startingBid
        ? { ...filter.startingBid, $lte: parseInt(max_price) }
        : { $lte: parseInt(max_price) };
    }
    if (isActive === "true") {
      filter.isActive = true;
    }
    if (isActive === "false") {
      filter.isActive = false;
    }
    if (type) {
      filterProperty["property.type"] = type;
    }
    if (real_estate_type) {
      filterProperty["property.details.real_estate_type"] = real_estate_type;
    }

    if (property_formatted_street_address) {
      filterProperty[
        "property.details.property_address.formatted_street_address"
      ] = property_formatted_street_address;
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
    if (manufacturer_name) {
      filterProperty["property.details.manufacturer_name"] = manufacturer_name;
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

    if (req.admin?.permissions.includes("auction_read")) {
      auctions = await Auction.find(filter).populate({
        path: "property",
        select:
          "type createdBy details.owner_name details.property_address images.url",
        populate: { path: "createdBy", select: "userName" },
      }); //should add filter by property as well.

      if (isSold === "true") {
        auctions = auctions.filter((auction) => {
          return auction.winner.buyerId;
        });
        auctions = await Promise.all(
          auctions.map(async (auction) => {
            const buyer = await Buyer.findById(auction.winner.buyerId);
            const user = await User.findById(buyer.userId);
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
      const auctionCount = auctions.length;
      const totalPages = Math.ceil(auctionCount / limit);
      auctions = auctions.slice((page - 1) * limit, (page - 1) * limit + limit);
      res.header({
        "Pagination-Count": auctionCount,
        "Pagination-Total-Pages": totalPages,
        "Pagination-Page": page,
        "Pagination-Limit": limit,
      });
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
                documents: {
                  '$filter': {
                      input: '$documents',
                      as: 'documents',
                      cond: { $eq: ['$$documents.isVisible', true] }
                  }
               },
              },
            },
          ],
        },
      },
      { $unwind: { path: "$property" }},
      { $match: filterProperty },
      {
        $unset: ["incrementAmount", "bids"],
        // time === "completed"
        //   ? ["incrementAmount", "bids"]
        //   : ["incrementAmount", "winner", "bids"],
      },
    ]);

    if (isSold === "true") {
      auctions = auctions.filter((auction) => {
        return auction.winner?.buyerId;
      });
      auctions = await Promise.all(
        auctions.map(async (auction) => {
          const buyer = await Buyer.findById(auction.winner.buyerId);
          const user = await User.findById(buyer.userId);
          return {
            ...auction,
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

    const auctionCount = auctions.length;
    const totalPages = Math.ceil(auctionCount / limit);
    auctions = auctions.slice((page - 1) * limit, (page - 1) * limit + limit);
    res.header({
      "Pagination-Count": auctionCount,
      "Pagination-Total-Pages": totalPages,
      "Pagination-Page": page,
      "Pagination-Limit": limit,
    });


    return res.status(200).send(auctions);
  } catch (err) {
    res.status(500).send(err);
  }
};

//@desc  Get information of auction
//@route GET /api/auctions/:id
//@route GET /api/auction/propertyId/:propertyId?fields=bidders
const getAuction = async (req, res) => {
  try {
    const url = req.originalUrl;
    let auction, user;
    let { fields } = req.query;

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

    if (req.user) {
      user = await User.findById(req.user.id).select("_id dueDiligence");
    }

    if (!auction) return res.status(200).send({ error: "Auction not found!" });
    auction.viewCounts = auction.viewCounts + 1;
    await auction.save();

    const { numberOfBids, highestBid, highestBidders } =
      await getBidsInformation(auction.bids, auction.startingBid);
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
    if (req.admin?.permissions.includes("auction_read")) {
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
    // normal logged in user: can only see documents which approved due diligence
    if (!user || !user.dueDiligence.includes(auction.property._id)) {
      auction.property.documents = [];
    }

    //Authenticate: registered buyer & be approved at least 1 fund can see list top 5, not whole list of bids
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
    let isApprovedToBid = false;

    if (isRegisteredToBuy) {
      for (let fund of isRegisteredToBuy.funds) {
        if (fund.document.isVerified === "success") {
          isApprovedToBid = true;
          break;
        }
      }
    }

    if (isRegisteredToBuy && isApprovedToBid) {
      return res.status(200).send(auction);
    }
    if (isRegisteredToBuy && !isApprovedToBid) {
      delete auction.highestBidders;
      delete auction.isReservedMet;
      return res.status(200).send(auction);
    }

    //Authenticate: registered buyer not approved cannot see highestBidders and if reserved is met
    //Authenticate: normal user, cannot see number of bids and highest bid: the same and add 1 field: "isNotRegisteredToBuy": true
    auction.isNotRegisteredToBuy = true;
    delete auction.highestBidders;
    delete auction.isReservedMet;
    delete auction.numberOfBids;
    delete auction.highestBid;
    return res.status(200).send(auction);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const getAuctionCount = async (req, res) => {};

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
          "-createdBy -isApproved -step -docusignId -createdAt -updatedAt",
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
          "-createdBy -isApproved -step -docusignId -createdAt -updatedAt", // should remove isDiscussed, temporarily put here for show in admin site to edit
      });

    allAuctions = await Promise.all(
      allAuctions
        .filter((auction) => auction.property)
        .map(async (auction) => {
          const { numberOfBids, highestBid, highestBidders } =
            await getBidsInformation(auction.bids, auction.startingBid);
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
        })
    );
    res.status(200).send(allAuctions);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//should remove this, as duplicate
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
//@route PUT /api/auctions/:id/bidding   body:{biddingTime, biddingPrice }
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
    let email, subject, text;
    const buyer = await Buyer.findOne({ userId: req.user.id, auctionId });
    const user = await User.findById(req.user.id);
    if (!buyer) {
      return res.status(200).send({ error: "User did not register to buy" });
    }

    const auction = await Auction.findOne({ _id: auctionId });
    if (!auction) {
      return res.status(200).send({ error: "Auction not found" });
    }

    const property = await Property.findById(auction.property);
    const owner = await User.findById(property.createdBy);

    //check if has enough funds for that property
    if (buyer.availableFund < biddingPrice) {
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

    //add money back to funds of the highest bidder & send email
    let highestBidder =
      auction.bids.length > 0 ? auction.bids.slice(-1)[0] : null;
    let emailBody;

    if (highestBidder) {
      let highestBuyer = await Buyer.findById(highestBidder.buyerId).populate(
        "userId"
      );
      highestBuyer.availableFund =
        highestBuyer.availableFund + highestBidder.amount;

      await highestBuyer.save();

      email = highestBuyer.userId.email;
      subject = "Auction Tree- You bid is not highest anymore";
      text = `Hi ${highestBuyer.firstName} ${highestBuyer.lastName} Your bid is not highest anymore, and your avaible fund for this property is now ${highestBuyer.availableFund}`;
      sendEmail({
        to: email,
        subject,
        text,
      });
    }

    //send email to others not highest bidders
    let otherNotHighestBidder =
      auction.bids.length > 0 ? auction.bids.splice(-1) : null;

    if (otherNotHighestBidder?.length > 0) {
      otherNotHighestBidder = await Promise.all(
        otherNotHighestBidder.map(async (i) => {
          let bidder = await Buyer.findById(i.buyerId);

          // let bidder = await Buyer.findBuyId(i.buyerId).populate({
          //   path: "userId",
          //   select: "email",
          // });
          return bidder.userId.email;
        })
      );
      email = otherNotHighestBidder;
      subject = "Auction Tree -New bidding price";
      text = `Notice- New bidding price for auction id ${auctionId} is $${biddingPrice}`;
      sendEmail({ to: email, subject, text });
    }

    // deduct money from new bidder
    buyer.availableFund = buyer.availableFund - biddingPrice;
    await buyer.save();

    //send email to this bidder, and their total available fund
    email = user.email;
    subject = "Auction Tree- Bidding completed successfully";
    text = `Hi ${user.firstName} ${user.lastName} Thank you for your bid. Your price is highest with ${biddingPrice} at ${biddingTime}`;
    user.notifications.push({
      auctionId: auction._id,
      message: `New bidding price ${biddingPrice} at ${biddingTime}`,
    });
    await user.save();
    sendEmail({ to: email, subject, text });

    //send email to owner
    email = owner.email;
    subject = "Auction Tree - New bidding price";
    text = `Hi ${owner.firstName} ${owner.lastName},new bidder ${buyer._id} bids your property ${auction._id} at $${biddingPrice} at ${biddingTime}`;
    owner.notifications.push({
      auctionId: auction._id,
      message: `New bidding price ${biddingPrice} at ${biddingTime}`,
    });
    await owner.save();
    sendEmail({ to: email, subject, text });

    //send email and notification to admins
    const admins = await getGeneralAdmins();
    sendEmail({
      to: admins.map((admin) => admin.email),
      subject: "Auction Tree - New bidding is placed",
      text: `A new bidding has been placed for this auction ${auction._id}. Please check this new bidding in admin site`,
    });
    addNotificationToAdmin(admins, {
      auctionId: auction._id,
      buyerId: buyer._id,
      message: `New bidding price $${biddingPrice} is placed`,
    });

    const newBidder = {
      buyerId: buyer._id,
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
      subject = `Auction Tree - Auction for your property with number ${auction.property._id} ended`;
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
      subject = "Auction Tree- Congratulation for winning an auction";
      text = `Congratulation for winning auction for property with id number ${auction.property._id}`;
      sendEmail({ to: email, subject, text });

      email = auction.property.createdBy.email;
      subject = "Auction Tree - Your property has been successfully sold";
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
        let subject = "Auction Tree - Discuss auction price";
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

//@desc Set winner of auction
//@route PUT /api/auctions/:id/winner body {buyerId, amount}
const setWinner = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id).populate({
      path: "property",
      select: "_id type details images reservedAmount",
    });
    let time = new Date();
    let buyer, amount;
    if (!auction.isActive) {
      return res.status(200).send({ error: "Auction is not active" });
    }

    if (time.getTime() < auction.auctionEndDate.getTime()) {
      return res.status(200).send({ error: "Auction has not ended yet" });
    }

    if (req.admin?.permissions.includes("auction_edit")) {
      buyer = await Buyer.findById(req.body.buyerId).populate({
        path: "userId",
        select: "_id firstName lastName email",
      });
      if (buyer.auctionId.toString() !== req.params.id) {
        return res
          .status(200)
          .send({ error: "This buyer not register to buy this property" });
      }
      amount = req.body.amount;
    } else {
      let lastBidder = auction.bids.slice(-1)[0];
      if (!lastBidder || lastBidder.amount < auction.property.reservedAmount) {
        return res.status(200).send(auction);
      }
      buyer = await Buyer.findById(lastBidder.buyerId).populate({
        path: "userId",
        select: "_id firstName lastName email",
      });
      amount = lastBidder.amount;
    }

    auction.winner.buyerId = buyer._id;
    auction.winner.amount = amount;
    await auction.save();

    let emailBody = await replaceEmailTemplate("winner_of_auction", {
      name: `${buyer.userId.firstName} ${buyer.userId.lastName}`,
      property_type: `${auction.property.type}`,
      property_address: `${auction.property.details.property_address.formatted_street_address} ${auction.property.details.property_address.zip_code} ${auction.property.details.property_address.city} ${auction.property.details.property_address.state} ${auction.property.details.property_address.country}`,
    });
    sendEmail({
      to: buyer.userId.email,
      subject: emailBody.subject,
      htmlText: emailBody.content,
    });
    console.log(user);
    user.notifications.push({
      auctionId: auction._id,
      message: "Congratulation- winner of the auction",
    });
    await user.save();

    //send emails to seller
    const seller = await User.findById(auction.property.createdBy);

    sendEmail({
      to: seller.email,
      subject: "Auction Tree - A winner is set for your auction property",
      text: `A buyer with id ${buyer._id} is the winner of your property ${auction.property.type} at ${auction.property.details.property_address.formatted_street_address}  ${auction.property.details.property_address.zip_code} ${auction.property.details.property_address.city} ${auction.property.details.property_address.state} ${auction.property.details.property_address.country} with highest bidding price of $${amount}`,
    });
    seller.notifications.push({
      auctionId: auction._id,
      winner: buyer._id,
      message: "Congratulation- a winner for auction has been set",
    });

    //send email to admins
    const admins = await getGeneralAdmins();
    sendEmail({
      to: admins.map((admin) => admin.email),
      subject: "Auction Tree - Winner for Auction",
      text: `A winner for auction  ${auction._id} has been set. Please check this winner in admin site`,
    });
    addNotificationToAdmin(admins, {
      auctionId: auction._id,
      winner: buyer._id,
      message: "Winner for auction has been set",
    });

    return res.status(200).send({
      ...auction.toObject(),
      winner: {
        winner: {
          buyerId: buyer._id,
          userId: buyer.userId._id,
          amount,
          time,
          firstName: buyer.userId.firstName,
          lastName: buyer.userId.lastName,
          email: buyer.userId.email,
        },
      },
    });
  } catch (err) {
    return res.status(500).send(err.message);
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
  getAuctions,
  setWinner,
  getAuctionCount,
};
