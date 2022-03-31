const Property = require("../model/Property");
const User = require("../model/User");
const Buyer = require("../model/Buyer");
const Auction = require("../model/Auction");
const axios = require("axios");
const { sendEmail, getBidsInformation } = require("../helper");
const Joi = require("joi").extend(require("@joi/date"));
Joi.objectId = require("joi-objectid")(Joi);
const { propertyObjectSchema } = require("../middleware/validateRequest");

//@desc  Search a real-estate with an address
//@route POST /api/properties/real-estates/search query params:{street_address, city, state}
// should be GET request because just get information
const search = async (req, res) => {
  const { street_address, city, state } = req.query;
  try {
    const response = await axios.get(process.env.THIRD_PARTY_API, {
      params: { street_address, city, state },
    });
    if (response.status !== 200) {
      console.log(response);
    }
    res.status(200).send(response.data.data);
  } catch (error) {
    res.send(error);
  }
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
      country,
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

    let bodySchema = {};
    let objectSchema = {
      step1: propertyObjectSchema.step1,
      step2: propertyObjectSchema.step2["real-estate"],
      step3: propertyObjectSchema.step3,
      step4: propertyObjectSchema.step4["real-estate"],
      step5: propertyObjectSchema.step5,
    };

    if (!(step === 1 || step === 2 || step === 3 || step === 4 || step === 5)) {
      return res
        .status(200)
        .send({ error: "step must be a number from 1 to 5" });
    }

    for (let i = 1; i <= step; i++) {
      bodySchema = { ...bodySchema, ...objectSchema[`step${i}`] };
    }
    bodySchema = Joi.object(bodySchema);
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
        details = { ...details, ...response };
      } else {
        details.property_address = {};
        details.property_address.formatted_street_address = street_address;
        details.property_address.city = city;
        details.property_address.state = state;
        details.property_address.zip_code = zip_code;
      }
      details.property_address.country = country;
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

//@desc  Create a car/jet/yacht
//@route POST /api/properties/:id
const createOthers = async (req, res) => {
  {
    try {
      let {
        type,
        details,
        reservedAmount,
        discussedAmount,
        images,
        videos,
        documents,
        docusignId,
        step,
      } = req.body;

      if (
        !(step === 1 || step === 2 || step === 3 || step === 4 || step === 5)
      ) {
        return res
          .status(200)
          .send({ error: "step must be a number from 1 to 5" });
      }
      let bodySchema;
      let objectSchema = {
        step1: propertyObjectSchema.step1,
        step2: propertyObjectSchema.step2[`${type}`],
        step3: propertyObjectSchema.step3,
        step4: propertyObjectSchema.step4[`${type}`],
        step5: propertyObjectSchema.step5,
      };

      for (let i = 1; i <= step; i++) {
        bodySchema = { ...bodySchema, ...objectSchema[`step${i}`] };
      }
      bodySchema = Joi.object(bodySchema);
      const { error } = bodySchema.validate(req.body);
      if (error)
        return res.status(200).send({ error: error.details[0].message });

      //Check if seller is a broker, require listing_agreement
      if (details.broker_name) {
        let isHavingListingAgreement = false;
        for (let item of documents) {
          if (item.officialName === "listing_agreement") {
            isHavingListingAgreement = true;
          }
        }
        if (!isHavingListingAgreement) {
          return res
            .status(200)
            .send({ error: "Listing Agreement is required" });
        }
      }

      // Step 2: check discussedAmount and reservedAmount
      if (discussedAmount > reservedAmount) {
        return res.status(200).send({
          error:
            "Discussed amount must be less than or equal to reserved amount",
        });
      }

      if (step !== 1) {
        if (type === "car") {
          let {
            make,
            model,
            year,
            mileage,
            transmission,
            car_type,
            power,
            color,
            VIN,
            engine,
            fuel_type,
            condition,
            price,
            property_address,
          } = req.body;
          details.make = make;
          details.model = model;
          details.year = year;
          details.mileage = mileage;
          details.transmission = transmission;
          details.car_type = car_type;
          details.power = power;
          details.color = color;
          details.VIN = VIN;
          details.engine = engine;
          details.fuel_type = fuel_type;
          details.condition = condition;
          details.price = price;
          details.property_address = property_address;
        }
        if (type === "yacht") {
          let {
            vessel_registration_number,
            vessel_manufacturing_date,
            manufacture_mark,
            manufacturer_name,
            engine_type,
            engine_manufacture_name,
            engine_deck_type,
            detain,
            running_cost,
            no_of_crew_required,
            property_address,
          } = req.body;
          details.vessel_registration_number = vessel_registration_number;
          details.vessel_manufacturing_date = vessel_manufacturing_date;
          details.manufacture_mark = manufacture_mark;
          details.manufacturer_name = manufacturer_name;
          details.engine_type = engine_type;
          details.engine_manufacture_name = engine_manufacture_name;
          details.engine_deck_type = engine_deck_type;
          details.detain = detain;
          details.running_cost = running_cost;
          details.no_of_crew_required = no_of_crew_required;
          details.property_address = property_address;
        }
        if (type === "jet") {
          let {
            registration_mark,
            aircraft_builder_name,
            aircraft_model_designation,
            aircraft_serial_no,
            engine_builder_name,
            engine_model_designation,
            number_of_engines,
            propeller_builder_name,
            propeller_model_designation,
            number_of_aircraft,
            imported_aircraft,
            property_address,
          } = req.body;
          details.registration_mark = registration_mark;
          details.aircraft_builder_name = aircraft_builder_name;
          details.aircraft_model_designation = aircraft_model_designation;
          details.aircraft_serial_no = aircraft_serial_no;
          details.engine_builder_name = engine_builder_name;
          details.engine_model_designation = engine_model_designation;
          details.number_of_engines = number_of_engines;
          details.propeller_builder_name = propeller_builder_name;
          details.propeller_model_designation = propeller_model_designation;
          details.number_of_aircraft = number_of_aircraft;
          details.imported_aircraft = imported_aircraft;
          details.property_address = property_address;
        }
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
      //   subject: `Auction 10X-Listing  ${type} status`,
      //   text: "Thank you for listing a property for sell. We are reviewing your documents and will instruct you the next step of selling process in short time. ",
      // });
      res.status(200).send(savedProperty);
    } catch (error) {
      res.status(500).send(error.message);
    }
  }
};

//@desc  Edit a real-estate
//@route PUT /api/properties/real-estate/:id

const editRealestate = async (req, res) => {
  try {
    let {
      type,
      details,
      street_address,
      city,
      state,
      zip_code,
      country,
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

    // Validate body
    let bodySchema = {};
    let isEditStep2;
    const objectSchema = {
      step1: propertyObjectSchema,
      step2: propertyObjectSchema.step2["real-estate"],
      step3: propertyObjectSchema.step3,
      step4: propertyObjectSchema.step4["real-estate"],
      step5: propertyObjectSchema.step5,
    };

    if (!(step === 1 || step === 2 || step === 3 || step === 4 || step === 5)) {
      return res
        .status(200)
        .send({ error: "step must be a number from 1 to 5" });
    }
    if (property.step >= step) {
      bodySchema = Joi.object(objectSchema[`step${step}`]);
      if (step === 2) {
        isEditStep2 = true;
      }
    } else {
      for (let i = property.step + 1; i <= step; i++) {
        bodySchema = { ...bodySchema, ...objectSchema[`step${i}`] };
        if (property.step === 1) {
          isEditStep2 = true;
        }
      }
      bodySchema = Joi.object(bodySchema);
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
        details = { ...property.details, ...response };
      } else {
        property.details.property_address = property.details.property_address
          ? property.details.property_address
          : {};
        property.details.property_address.formatted_street_address =
          street_address;
        property.details.property_address.city = city;
        property.details.property_address.state = state;
        property.details.property_address.zip_code = zip_code;
      }
      property.details.property_address.country = country;
      property.details.parcel = property.details.parcel
        ? property.details.parcel
        : {};
      property.details.parcel.standardized_land_use_type =
        standardized_land_use_type;
      property.details.parcel.area_sq_ft = area_sq_ft;
      property.details.structure = property.details.structure
        ? property.details.structure
        : {};
      property.details.structure.rooms_count = rooms_count;
      property.details.structure.beds_count = beds_count;
      property.details.structure.baths = baths_count;
      property.details.owner = property.details.owner
        ? property.details.owner
        : {};
      property.details.owner.name = owner_name;
      property.details.market_assessments = [
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

//@desc  Edit a car/jet/yacht
//@route PUT /api/properties/:id
const editOthers = async (req, res) => {
  try {
    let {
      type,
      details,
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

    // Validate body
    let bodySchema = {};
    let isEditStep2;
    let objectSchema = {
      step1: propertyObjectSchema.step1,
      step2: propertyObjectSchema.step2[`${type}`],
      step3: propertyObjectSchema.step3,
      step4: propertyObjectSchema.step4[`${type}`],
      step5: propertyObjectSchema.step5,
    };

    if (!(step === 1 || step === 2 || step === 3 || step === 4 || step === 5)) {
      return res
        .status(200)
        .send({ error: "step must be a number from 1 to 5" });
    }
    if (property.step >= step) {
      bodySchema = Joi.object(objectSchema[`step${step}`]);
      if (step === 2) {
        isEditStep2 = true;
      }
    } else {
      for (let i = property.step + 1; i <= step; i++) {
        bodySchema = { ...bodySchema, ...objectSchema[`step${i}`] };
        if (property.step === 1) {
          isEditStep2 = true;
        }
      }
      bodySchema = Joi.object(bodySchema);
    }
    const { error } = bodySchema.validate(req.body);
    if (error) return res.status(200).send({ error: error.details[0].message });

    // if edit anything in step 2 need to be proccessed reservedAmount and add information in details field.
    if (isEditStep2) {
      if (discussedAmount > reservedAmount) {
        return res.status(200).send({
          error:
            "Discussed amount must be less than or equal to reserved amount",
        });
      }
      if (property.type === "car") {
        let {
          make,
          model,
          year,
          mileage,
          transmission,
          car_type,
          power,
          color,
          VIN,
          engine,
          fuel_type,
          condition,
          price,
          property_address,
        } = req.body;
        property.details.make = make;
        property.details.model = model;
        property.details.year = year;
        property.details.mileage = mileage;
        property.details.transmission = transmission;
        property.details.car_type = car_type;
        property.details.power = power;
        property.details.color = color;
        property.details.VIN = VIN;
        property.details.engine = engine;
        property.details.fuel_type = fuel_type;
        property.details.condition = condition;
        property.details.price = price;
        property.details.property_address = property_address;
      }
      if (property.type === "yacht") {
        let {
          vessel_registration_number,
          vessel_manufacturing_date,
          manufacture_mark,
          manufacturer_name,
          engine_type,
          engine_manufacture_name,
          engine_deck_type,
          detain,
          running_cost,
          no_of_crew_required,
          property_address,
        } = req.body;
        property.details.vessel_registration_number =
          vessel_registration_number;
        property.details.vessel_manufacturing_date = vessel_manufacturing_date;
        property.details.manufacture_mark = manufacture_mark;
        property.details.manufacturer_name = manufacturer_name;
        property.details.engine_type = engine_type;
        property.details.engine_manufacture_name = engine_manufacture_name;
        property.details.engine_deck_type = engine_deck_type;
        property.details.detain = detain;
        property.details.running_cost = running_cost;
        property.details.no_of_crew_required = no_of_crew_required;
        property.details.property_address = property_address;
      }
      if (type === "jet") {
        let {
          registration_mark,
          aircraft_builder_name,
          aircraft_model_designation,
          aircraft_serial_no,
          engine_builder_name,
          engine_model_designation,
          number_of_engines,
          propeller_builder_name,
          propeller_model_designation,
          number_of_aircraft,
          imported_aircraft,
          property_address,
        } = req.body;
        property.details.registration_mark = registration_mark;
        property.details.aircraft_builder_name = aircraft_builder_name;
        property.details.aircraft_model_designation =
          aircraft_model_designation;
        property.details.aircraft_serial_no = aircraft_serial_no;
        property.details.engine_builder_name = engine_builder_name;
        property.details.engine_model_designation = engine_model_designation;
        property.details.number_of_engines = number_of_engines;
        property.details.propeller_builder_name = propeller_builder_name;
        property.details.propeller_model_designation =
          propeller_model_designation;
        property.details.number_of_aircraft = number_of_aircraft;
        property.details.imported_aircraft = imported_aircraft;
        property.details.property_address = property_address;
      }
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

//@desc  Get properties (sorting by created date) by page and limit
//@desc filter by: ?type=... & status=... & inAuction=true &completed=true
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
      type: Joi.string().valid("real-estate", "car", "jet", "yacht").optional(),
      completed: Joi.string().valid("true", "false").optional(),
    });
    const { error } = paramsSchema.validate(req.query);
    if (error) return res.status(200).send({ error: error.details[0].message });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const { inAuction, status: isApproved, type, completed } = req.query;
    let filters = { step: 5 };
    if (isApproved) {
      filters.isApproved = isApproved;
    }
    if (type) {
      filters.type = type;
    }

    let properties = [];
    if (completed === "true") {
      filters.step = 5;
    } else if (completed === "false") {
      filters.step = { $lt: 5 };
    }
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
  getProperties,
  getProperty,
  createOthers,
  editOthers,
  approveProperty,
  verifyDocument,
  verifyImage,
  verifyVideo,
  createRealestate,
  editRealestate,
};
