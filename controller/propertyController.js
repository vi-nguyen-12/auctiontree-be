const Property = require("../model/Property");
const User = require("../model/User");
const Buyer = require("../model/Buyer");
const Auction = require("../model/Auction");
const axios = require("axios");
const { sendEmail, getBidsInformation } = require("../helper");
const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);

//@desc  Search a real-estate with an address
//@route POST /api/properties/real-estates/search query params:{street_address, city, state}
// should be GET request because just get information
const search = async (req, res) => {
  const { street_address, city, state } = req.query;
  try {
    const response = await axios.get(process.env.THIRD_PARTY_API, {
      params: { street_address, city, state },
    });
    // const addressExist = await Property.findOne({
    //   type: "real-estate",
    //   "details.property_address.formatted_street_address": response.data.data.address.formatted_street_address,
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
    if (response.status !== 200) {
      console.log(response);
    }
    res.status(200).send(response.data.data);
  } catch (error) {
    res.send(error);
  }
};

//@desc  Create a real-estate
//@route POST /api/properties/real-estate/ body:{type, street_address, city, state, images, videos, documents, docusignId, reservedAmount, discussedAmount}
const createRealestateOld = async (req, res) => {
  {
    try {
      const {
        type,
        street_address,
        city,
        state,
        images,
        videos,
        documents,
        docusignId,
        reservedAmount,
        discussedAmount,
        details,
      } = req.body;

      // const { rooms_count, beds_count, baths } = fields;

      if (discussedAmount > reservedAmount) {
        return res.status(200).send({
          error:
            "Discussed amount must be less than or equal to reserved amount",
        });
      }
      const response = await axios.get(process.env.THIRD_PARTY_API, {
        params: { street_address, city, state },
      });
      delete Object.assign(response.data.data, {
        property_address: response.data.data.address,
      })["address"];

      const newEstates = new Property({
        createdBy: req.user.userId,
        type,
        details: { ...details, ...response.data.data },
        images,
        videos,
        documents,
        docusignId,
        reservedAmount,
        discussedAmount,
      });
      // newEstates.details.structure.rooms_count = rooms_count;
      // newEstates.details.structure.beds_count = beds_count;
      // newEstates.details.structure.baths = baths;

      const savedNewEstates = await newEstates.save();
      const { email } = await User.findOne({ _id: req.user.userId }, "email");
      // sendEmail({
      //   email,
      //   subject: "Auction 10X-Listing real-estate status",
      //   text: "Thank you for listing a property for sell. We are reviewing your documents and will instruct you the next step of selling process in short time. ",
      // });
      res.status(200).send(savedNewEstates);
    } catch (error) {
      res.status(500).send(error.message);
    }
  }
};

const step1Schema = {
  type: Joi.string().valid("real-estate").required(),
  details: Joi.object({
    owner_name: Joi.string().required(),
    broker_name: Joi.string().allow(null),
    broker_id: Joi.when("broker_name", {
      is: Joi.exist(),
      then: Joi.string().required(),
      otherwise: Joi.string().allow(null),
    }),
    address: Joi.string().required(),
    email: Joi.string()
      .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } })
      .required(),
    phone: Joi.string()
      .length(10)
      .pattern(/^[0-9]+$/)
      .required(),
  }).required(),
  documents: Joi.when("details", {
    is: Joi.object({
      owner_name: Joi.exist(),
      broker_name: Joi.exist(),
      broker_id: Joi.exist(),
      address: Joi.exist(),
      email: Joi.exist(),
      phone: Joi.exist(),
    }),
    then: Joi.array()
      .items({
        officialName: Joi.string().valid("listing_agreement"),
        name: Joi.string().required(),
        url: Joi.string().required(),
      })
      .required(),
    otherwise: Joi.array().forbidden(),
  }),
  step: Joi.number().required().valid(1),
};
const step2SchemaRealEstate = {
  street_address: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  zip_code: Joi.string().regex(/^\d+$/).length(5).required(),
  // country: Joi.string().required(),
  owner_name: Joi.string().required(),
  rooms_count: Joi.number().required(),
  beds_count: Joi.number().required(),
  baths_count: Joi.number().required(),
  standardized_land_use_type: Joi.string().required(),
  total_value: Joi.number().required(),
  area_sq_ft: Joi.number().required(),
  reservedAmount: Joi.number().required(),
  discussedAmount: Joi.number().required(),
  step: Joi.number().required().valid(2),
};
const step2SchemaCar = {
  make: Joi.string().required(),
  model: Joi.string().required(),
  year: Joi.date().format("YYYY").required(),
  mileage: Joi.number().required(),
  transmission: Joi.string().required(),
  car_type: Joi.string().required(),
  power: Joi.string().required(),
  color: Joi.string().required(),
  VIN: Joi.string().required(),
  engine: Joi.string().required(),
  fuel_type: Joi.string().required(),
  condition: Joi.string().required(),
  price: Joi.number().required(),
  property_address: Joi.string().required(),
};
const step2SchemaYacht = {
  vessel_registration_number: Joi.string().required(),
  vessel_manufacturing_date: Joi.date().required(),
  manufacture_mark: Joi.string().required(),
  manufacturer_name: Joi.string().required(),
  engine_type: Joi.string().required(),
  engine_manufacture_name: Joi.string().required(),
  engine_deck_type: Joi.string().required(),
  detain: Joi.string(),
  running_cost: Joi.number().required(),
  no_of_crew_required: Joi.number().required(),
  property_address: Joi.string().required(),
};
const step3Schema = {
  images: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        url: Joi.string().required(),
      })
    )
    .min(1)
    .required(),
  videos: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      url: Joi.string().required(),
    })
  ),
  step: Joi.number().required().valid(3),
};
const step4Schema = {
  documents: Joi.array().items(
    Joi.object({
      officialName: Joi.string()
        .valid(
          "title_report",
          "insurance_copy",
          "financial_document",
          "purchase_agreement",
          "third-party_report",
          "demographics",
          "market_and_valuations",
          "listing_agreement"
        )
        .required(),
      url: Joi.string().required(),
      name: Joi.string().required(),
    })
  ),
  step: Joi.number().required().valid(4),
};
const step5Schema = {
  docusignId: Joi.objectId().required(),
  step: Joi.number().required().valid(5),
};

const createRealestate = async (req, res) => {
  try {
    let {
      type,
      details,
      street_address,
      city,
      state,
      zip_code,
      // country,
      owner_name,
      rooms_count,
      beds_count,
      baths_count,
      standardized_land_use_type,
      total_value,
      area_sq_ft,
      reservedAmount,
      discussedAmount,
      images,
      videos,
      documents,
      docusignId,
      step,
    } = req.body;

    let bodySchema;

    if (!(step === 1 || step === 2 || step === 3 || step === 4 || step === 5)) {
      return res
        .status(200)
        .send({ error: "step must be a number from 1 to 5" });
    }
    if (step === 1) {
      bodySchema = Joi.object({ ...step1Schema });
    }
    if (step === 2) {
      bodySchema = Joi.object({ ...step1Schema, ...step2SchemaRealEstate });
    }
    if (step === 3) {
      bodySchema = Joi.object({
        ...step1Schema,
        ...step2SchemaRealEstate,
        ...step3Schema,
      });
    }
    if (step === 4) {
      bodySchema = Joi.object({
        ...step1Schema,
        ...step2SchemaRealEstate,
        ...step3Schema,
        ...step4Schema,
      });
    }
    if (step === 5) {
      bodySchema = Joi.object({
        ...step1Schema,
        ...step2SchemaRealEstate,
        ...step3Schema,
        ...step4Schema,
        ...step5Schema,
      });
    }

    const { error } = bodySchema.validate(req.body);
    if (error) return res.status(200).send({ error: error.details[0].message });

    //Check if seller is a broker, require listing_agreement
    if (details.broker_name) {
      let isHavingListingAgreement = false;
      for (let item of documents) {
        if (item.officialName === "listing_agreement") {
          isHavingListingAgreement = true;
        }
      }
      if (!isHavingListingAgreement) {
        return res.status(200).send({ error: "Listing Agreement is required" });
      }
    }
    //From step 2: check reservedAmount and disscussedAmount
    //From step 2: get details of real-estate from Estated and from input and add to details field;
    if (step !== 1) {
      if (discussedAmount > reservedAmount) {
        return res.status(200).send({
          error:
            "Discussed amount must be less than or equal to reserved amount",
        });
      }
      let response;
      axios
        .get(process.env.THIRD_PARTY_API, {
          params: { street_address, city, state },
        })
        .then((res) => {
          response = res.data.data;
        })
        .catch(() => {
          response = null;
        });
      if (response) {
        delete Object.assign(response, {
          property_address: response.address,
        })["address"];
        details = response;
      } else {
        details.property_address = {};
        details.property_address.formatted_street_address = street_address;
        details.property_address.city = city;
        details.property_address.state = state;
        details.property_address.zip_code = zip_code;
      }
      if (!response) {
        details.parcel = {};
        details.structure = {};
        details.owner = {};
      }
      details.parcel.standardized_land_use_type = standardized_land_use_type;
      details.parcel.area_sq_ft = area_sq_ft;
      details.structure.rooms_count = rooms_count;
      details.structure.beds_count = beds_count;
      details.structure.baths = baths_count;
      details.owner.name = owner_name;
      details.market_assessments = [
        { year: new Date().getFullYear(), total_value },
      ];
    }
    const newProperty = new Property({
      createdBy: req.user.userId,
      type,
      details,
      reservedAmount,
      discussedAmount,
      images,
      videos,
      documents,
      docusignId,
      step,
    });
    const savedProperty = await newProperty.save();

    const { email } = await User.findOne({ _id: req.user.userId }, "email");
    // sendEmail({
    //   email,
    //   subject: "Auction 10X-Listing real-estate status",
    //   text: "Thank you for listing a property for sell. We are reviewing your documents and will instruct you the next step of selling process in short time. ",
    // }

    res.status(200).send(savedProperty);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

//@desc  Edit a real-estate
//@route PUT /api/properties/real-estate/:id body:{type, street_address, city, state, images, videos, documents, reservedAmount, discussedAmount}
const editRealestate = async (req, res) => {
  try {
    let {
      type,
      details,
      street_address,
      city,
      state,
      zip_code,
      // country,
      owner_name,
      rooms_count,
      beds_count,
      baths_count,
      standardized_land_use_type,
      total_value,
      area_sq_ft,
      reservedAmount,
      discussedAmount,
      images,
      videos,
      documents,
      docusignId,
      step,
    } = req.body;

    const property = await Property.findOne({ _id: req.params.id });
    if (!property) {
      return res.status(200).send({ error: "Property not found" });
    }
    let bodySchema = {};
    let isEditStep2;

    if (!(step === 1 || step === 2 || step === 3 || step === 4 || step === 5)) {
      return res
        .status(200)
        .send({ error: "step must be a number from 1 to 5" });
    }

    if (property.step === 1) {
      switch (step) {
        case 1:
          bodySchema = Joi.object({ ...step1Schema });
          break;
        case 2:
          bodySchema = Joi.object({ ...step2Schema });
          isEditStep2 = true;
          break;
        case 3:
          bodySchema = Joi.object({ ...step2Schema, ...step3Schema });
          isEditStep2 = true;
          break;
        case 4:
          bodySchema = Joi.object({
            ...step2Schema,
            ...step3Schema,
            ...step4Schema,
          });
          isEditStep2 = true;
          break;
        case 5:
          bodySchema = Joi.object({
            ...step2Schema,
            ...step3Schema,
            ...step4Schema,
            ...step5Schema,
          });
          isEditStep2 = true;
      }
    }
    if (property.step === 2) {
      switch (step) {
        case 1:
          bodySchema = Joi.object({ ...step1Schema });
          break;
        case 2:
          bodySchema = Joi.object({ ...step2Schema });
          isEditStep2 = true;
          break;
        case 3:
          bodySchema = Joi.object({ ...step3Schema });
          break;
        case 4:
          bodySchema = Joi.object({ ...step3Schema, ...step4Schema });
          break;
        case 5:
          bodySchema = Joi.object({
            ...step3Schema,
            ...step4Schema,
            ...step5Schema,
          });
      }
    }
    if (property.step === 3) {
      switch (step) {
        case 1:
          bodySchema = Joi.object({ ...step1Schema });
          break;
        case 2:
          bodySchema = Joi.object({ ...step2Schema });
          isEditStep2 = true;
          break;
        case 3:
          bodySchema = Joi.object({ ...step3Schema });
          break;
        case 4:
          bodySchema = Joi.object({ ...step4Schema });
          break;
        case 5:
          bodySchema = Joi.object({ ...step4Schema, ...step5Schema });
      }
    }
    if (property.step === 4) {
      switch (step) {
        case 1:
          bodySchema = Joi.object({ ...step1Schema });
          break;
        case 2:
          bodySchema = Joi.object({ ...step2Schema });
          isEditStep2 = true;
          break;
        case 3:
          bodySchema = Joi.object({ ...step3Schema });
          break;
        case 4:
          bodySchema = Joi.object({ ...step4Schema });
          break;
        case 5:
          bodySchema = Joi.object({ ...step5Schema });
      }
    }
    if (property.step === 5) {
      switch (step) {
        case 1:
          bodySchema = Joi.object({ ...step1Schema });
          break;
        case 2:
          bodySchema = Joi.object({ ...step2Schema });
          isEditStep2 = true;
          break;
        case 3:
          bodySchema = Joi.object({ ...step3Schema });
          break;
        case 4:
          bodySchema = Joi.object({ ...step4Schema });
          break;
        case 5:
          bodySchema = Joi.object({ ...step5Schema });
      }
    }

    const { error } = bodySchema.validate(req.body);
    if (error) return res.status(200).send({ error: error.details[0].message });

    // if edit anything in step 2 need to be proccessed reservedAmount and get info from estated API
    if (isEditStep2) {
      if (discussedAmount > reservedAmount) {
        return res.status(200).send({
          error:
            "Discussed amount must be less than or equal to reserved amount",
        });
      }

      const response = await axios.get(process.env.THIRD_PARTY_API, {
        params: { street_address, city, state },
      });
      if (response.data.data) {
        delete Object.assign(response.data.data, {
          property_address: response.data.data.address,
        })["address"];
        details = { ...property.details, ...response.data.data };
      } else {
        details.property_address.formatted_street_address = street_address;
        details.property_address.city = city;
        details.property_address.state = state;
        details.property_address.zip_code = zip_code;
      }
      details.parcel.standardized_land_use_type = standardized_land_use_type;
      details.parcel.area_sq_ft = area_sq_ft;
      details.structure.rooms_count = rooms_count;
      details.structure.beds_count = beds_count;
      details.structure.baths = baths_count;
      details.owner.name = owner_name;
      details.market_assessments = [
        { year: new Date().getFullYear(), total_value },
      ];
    }
    property.type = type || property.type;
    property.details = details || property.details;
    property.reservedAmount = reservedAmount || property.reservedAmount;
    property.discussedAmount = discussedAmount || property.discussedAmount;
    property.images = images || property.images;
    property.videos = videos || property.videos;
    property.documents = documents || property.documents;
    property.docusignId = docusignId || property.docusignId;
    property.step = step >= property.step ? step : property.step;
    const savedProperty = await property.save();

    const { email } = await User.findOne({ _id: req.user.userId }, "email");
    // sendEmail({
    //   email,
    //   subject: "Auction 10X- Updating property",
    //   text: "Thank you for updating your property. We are reviewing your documents and will instruct you the next step of selling process in short time. ",
    // });
    res.status(200).send(savedProperty);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

//@desc  Create a car/jet/yacht
//@route POST /api/properties body:{type, details, images, videos, documents, docusignId, reservedAmount, discussedAmount}
const createOthers = async (req, res) => {
  {
    try {
      if (req.body.type === "car") {
        let {
          type,
          details,
          reservedAmount,
          discussedAmount,
          images,
          videos,
          documents,
          docusignId,
        } = req.body;
      }

      if (discussedAmount > reservedAmount) {
        return res.status(200).send({
          error:
            "Discussed amount must be less than or equal to reserved amount",
        });
      }
      const newProperty = new Property({
        createdBy: req.user.userId,
        type,
        details,
        images,
        videos,
        documents,
        docusignId,
        reservedAmount,
        discussedAmount,
      });
      const savedProperty = await newProperty.save();
      const { email } = await User.findOne({ _id: req.user.userId }, "email");
      // sendEmail({
      //   email,
      //   subject: `Auction 10X-Listing  ${type} status`,
      //   text: "Thank you for listing a property for sell. We are reviewing your documents and will instruct you the next step of selling process in short time. ",
      // });
      res.status(200).send(savedProperty);
    } catch (error) {
      res.status(500).send(error.message);
    }
  }
};

//@desc  Edit a car/jet/yacht

//@desc  Get properties (sorting by created date) by page and limit
//@desc filter by: ?type=... & status=... & inAuction=true
//@route GET /api/properties
const getProperties = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      status: Joi.alternatives(
        Joi.string().valid("pending", "success", "fail"),
        Joi.array().items(Joi.string())
      ).optional(),
      inAuction: Joi.string().valid("true", "false").optional(),
      page: Joi.string().regex(/^\d+$/).optional(),
      limit: Joi.string().regex(/^\d+$/).optional(),
      type: Joi.string().valid("real-estate", "car", "jet", "yacht"),
    });
    const { error } = paramsSchema.validate(req.query);
    if (error) return res.status(200).send({ error: error.details[0].message });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const { inAuction, status: isApproved, type } = req.query;
    let filters = {};
    if (isApproved) {
      filters.isApproved = isApproved;
    }
    if (type) {
      filters.type = type;
    }

    let properties = [];
    if (inAuction === "true") {
      const auctions = await Auction.find().select("property");
      const propertyIds = auctions.map((auction) => auction.property);
      properties = await Property.find({ _id: propertyIds })
        .find(filters)
        .sort({
          createdAt: -1,
        })
        .skip((page - 1) * limit)
        .limit(limit);
    } else if (inAuction === "false") {
      const auctions = await Auction.find().select("property");
      const propertyIds = auctions.map((auction) => auction.property);
      properties = await Property.find({ _id: { $nin: propertyIds } })
        .find(filters)
        .sort({
          createdAt: -1,
        })
        .skip((page - 1) * limit)
        .limit(limit);
    } else {
      properties = await Property.find(filters)
        .sort({
          createdAt: -1,
        })
        .skip((page - 1) * limit)
        .limit(limit);
    }
    console.log(properties.length);
    res.status(200).send(properties);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//@desc  Get a property
//@route GET /api/properties/:id
const getProperty = async (req, res) => {
  try {
    const property = await Property.findOne({
      _id: req.params.id,
    });
    if (!property) {
      return res.status(200).send("No property found");
    }
    res.status(200).send(property);
  } catch (error) {
    res.send(error);
  }
};

//@desc  Approve a property
//@route PUT /api/properties/:id/status body: {status: "pending"/"success"/"fail", rejectedReason:...  }
const approveProperty = async (req, res) => {
  try {
    const bodySchema = Joi.object({
      status: Joi.string().valid("pending", "success", "fail"),
      rejectedReason: Joi.when("status", {
        is: "fail",
        then: Joi.string().required(),
        otherwise: Joi.string().allow(null),
      }),
    });
    const { error } = bodySchema.validate(req.body);
    if (error) {
      return res.status(200).send({ error: error.details[0].message });
    }

    const { status, rejectedReason } = req.body;
    const property = await Property.findOne({ _id: req.params.id }).populate(
      "docusignId"
    );
    if (!property) {
      res.status(200).send({ error: "Property not found" });
    }
    const user = await User.findById(property.createdBy);

    if (status === "success") {
      if (property.docusignId.status !== "signing_complete") {
        return res.status(200).send({ error: "Docusign is not completed" });
      }
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
      // sendEmail({
      //   email: user.email,
      //   subject: "Auction10X- Property Application Approved",
      //   text: `Congratulation, your application to sell property is approved`,
      // });
    }
    if (status === "fail") {
      if (!rejectedReason) {
        return res
          .status(200)
          .send({ error: "Please specify reason for reject" });
      }
      property.rejectedReason = rejectedReason;
      // sendEmail({
      //   email: user.email,
      //   subject: "Auction10X- Property Application Rejected",
      //   text: `Your application to sell property is rejected. Reason: ${rejectedReason}`,
      // });
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
  const bodySchema = Joi.object({
    status: Joi.string().valid("pending", "success", "fail"),
  });
  const { error } = bodySchema.validate(req.body);
  if (error) {
    return res.status(200).send({ error: error.details[0].message });
  }

  const { status } = req.body;
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
  const bodySchema = Joi.object({
    status: Joi.string().valid("pending", "success", "fail"),
  });
  const { error } = bodySchema.validate(req.body);
  if (error) {
    return res.status(200).send({ error: error.details[0].message });
  }

  const { status } = req.body;
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
  const bodySchema = Joi.object({
    status: Joi.string().valid("pending", "success", "fail"),
  });
  const { error } = bodySchema.validate(req.body);
  if (error) {
    return res.status(200).send({ error: error.details[0].message });
  }

  const { status } = req.body;
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
  search,
  createRealestateOld,
  getProperties,
  getProperty,
  createOthers,
  approveProperty,
  verifyDocument,
  verifyImage,
  verifyVideo,
  createRealestate,
  editRealestate,
};
