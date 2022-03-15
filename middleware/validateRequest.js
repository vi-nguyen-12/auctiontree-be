const Joi = require("joi").extend(require("@joi/date"));
Joi.objectId = require("joi-objectid")(Joi);

const validateUser = (req, res, next) => {
  const userSchema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string()
      .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } })
      .required(),
    phone: Joi.string()
      .length(10)
      .pattern(/^[0-9]+$/)
      .required(),
    password: Joi.string().required(),
    userName: Joi.string().required(),
    country: Joi.string(),
    city: Joi.string(),
    profileImage: Joi.string(),
  });
  const { error } = userSchema.validate(req.body);
  if (error) {
    return res.status(200).send({ error: error.details[0].message });
  }
  next();
};

const validateUpdateUser = (req, res, next) => {
  const userSchema = Joi.object({
    firstName: Joi.string(),
    lastName: Joi.string(),
    email: Joi.string().email({
      minDomainSegments: 2,
      tlds: { allow: ["com", "net"] },
    }),
    phone: Joi.string()
      .length(10)
      .pattern(/^[0-9]+$/),
    userName: Joi.string(),
    country: Joi.string(),
    city: Joi.string(),
    profileImage: Joi.string(),
    old_password: Joi.string(),
    new_password: Joi.when("old_password", {
      is: Joi.exist(),
      then: Joi.string().required(),
      otherwise: Joi.string().allow(null),
    }),
  });
  const { error } = userSchema.validate(req.body);
  if (error) {
    return res.status(200).send({ error: error.details[0].message });
  }
  next();
};

const validateProperty = (req, res, next) => {
  const propertySchema = Joi.object({
    type: Joi.string().valid("real-estate", "jet", "car", "yacht").required(),
    street_address: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    // details: Joi.object().keys({}),
    images: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        url: Joi.string().required(),
      }).required()
    ),
    videos: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        url: Joi.string().required(),
      })
    ),
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
            "market_and_valuations"
          )
          .required(),
        url: Joi.string().required(),
        name: Joi.string().required(),
      })
    ),
    docusignId: Joi.objectId().required(),
    reservedAmount: Joi.number().required().strict(),
    discussedAmount: Joi.number().required().strict(),
  });
  const { error } = propertySchema.validate(req.body);
  if (error) {
    return res.status(200).send({ error: error.details[0].message });
  }
  next();
};
const validateOthers = (req, res, next) => {
  const propertySchema = Joi.object({
    type: Joi.string().valid("jet", "car", "yacht").required(),
    details: Joi.when("type", {
      is: "car",
      then: Joi.object({
        owner_name: Joi.string().required(),
        broker_name: Joi.string(),
        broker_id: Joi.when("broker_name", {
          is: Joi.exist(),
          then: Joi.string().required(),
          otherwise: Joi.string().min(1),
        }),
        address: Joi.string().required(),
        email: Joi.string()
          .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } })
          .required(),
        phone: Joi.string()
          .length(10)
          .pattern(/^[0-9]+$/)
          .required(),
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
        address: Joi.string().required(),
      }).required(),
    })
      .when("type", {
        is: "yacht",
        then: Joi.object({
          owner_name: Joi.string().required(),
          broker_name: Joi.string(),
          broker_id: Joi.when("broker_name", {
            is: Joi.exist(),
            then: Joi.string().required(),
            otherwise: Joi.string().min(1),
          }),
          address: Joi.string().required(),
          email: Joi.string()
            .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } })
            .required(),
          phone: Joi.string()
            .length(10)
            .pattern(/^[0-9]+$/)
            .required(),
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
        }),
      })
      .when("type", {
        is: "jet",
        then: Joi.object({
          owner_name: Joi.string().required(),
          broker_name: Joi.string(),
          broker_id: Joi.when("broker_name", {
            is: Joi.exist(),
            then: Joi.string().required(),
            otherwise: Joi.string().min(1),
          }),
          address: Joi.string().required(),
          email: Joi.string()
            .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } })
            .required(),
          phone: Joi.string()
            .length(10)
            .pattern(/^[0-9]+$/)
            .required(),
          registration_mark: Joi.string().required(),
          aircraft_builder_name: Joi.string().required(),
          aircraft_model_designation: Joi.string().required(),
          aircraft_serial_no: Joi.string().required(),
          engine_builder_name: Joi.string().required(),
          engine_model_designation: Joi.string().required(),
          number_of_engines: Joi.number().required(),
          propeller_builder_name: Joi.string().required(),
          propeller_model_designation: Joi.string().required(),
        }).required(),
      })
      .required(),
    images: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        url: Joi.string().required(),
      }).required()
    ),
    videos: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        url: Joi.string().required(),
      })
    ),
    documents: Joi.array().items(
      Joi.object({
        officialName: Joi.when("type", {
          is: "car",
          then: Joi.string()
            .valid(
              "ownership_document",
              "registration_document",
              "title_certificate",
              "inspection_report",
              "engine_details",
              "insurance_document",
              "loan_document",
              "valuation_report",
              "listing_agreement",
              "others"
            )
            .required(),
        })
          .when("type", {
            is: "yacht",
            then: Joi.string()
              .valid(
                "vessel_registration",
                "vessel_maintenance_report",
                "vessel_engine_type",
                "vessel_performance_report",
                "vessel_deck_details",
                "vessel_insurance",
                "vessel_marine_surveyor_report",
                "vessel_valuation_report",
                "listing_agreement",
                "others"
              )
              .required(),
          })
          .when("type", {
            is: "jet",
            then: Joi.string()
              .valid(
                "ownership_document",
                "registration_document",
                "title_certificate",
                "detail_specification",
                "insurance_document",
                "loan_document",
                "jet_detail_history",
                "fitness_report",
                "electric_work_details",
                "engine_details",
                "inspection_report",
                "valuation_report",
                "listing_agreement",
                "others"
              )
              .required(),
          }),
        url: Joi.string().required(),
        name: Joi.string().required(),
      })
    ),
    docusignId: Joi.objectId().required(),
    reservedAmount: Joi.number().required().strict(),
    discussedAmount: Joi.number().required().strict(),
  });
  const { error } = propertySchema.validate(req.body);
  if (error) {
    return res.status(200).send({ error: error.details[0].message });
  }
  next();
};

const validateBuyer = (req, res, next) => {
  const buyerSchema = Joi.object({
    auctionId: Joi.objectId().required(),
    answers: Joi.array().items(
      Joi.object({
        questionId: Joi.objectId().required(),
        answer: Joi.string().valid("yes", "no").required(),
      })
    ),
    documents: Joi.array().items(
      Joi.object({
        officialName: Joi.string()
          .valid(
            "bank_statement",
            "brokerage_account_statement",
            "crypto_account_statement",
            "line_of_credit_doc"
          )
          .required(),
        url: Joi.string().required(),
        name: Joi.string().required(),
      })
    ),
    docusign: Joi.objectId().required(),
    TC: Joi.object({
      time: Joi.date().iso().required(),
      IPAddress: Joi.string().required(),
    }),
  });
  const { error } = buyerSchema.validate(req.body);
  if (error) {
    return res.status(200).send({ error: error.details[0].message });
  }
  next();
};

const validateAuction = (req, res, next) => {
  const auctionSchema = Joi.object({
    propertyId: Joi.objectId().required(),
    startingBid: Joi.number().required().strict(),
    incrementAmount: Joi.number().required().strict(),
    registerStartDate: Joi.date().iso().required(),
    registerEndDate: Joi.date().iso().required(),
    auctionStartDate: Joi.date().iso().required(),
    auctionEndDate: Joi.date().iso().required(),
  });
  const { error } = auctionSchema.validate(req.body);
  if (error) {
    return res.status(200).send({ error: error.details[0].message });
  }
  next();
};
module.exports = {
  validateUser,
  validateUpdateUser,
  validateProperty,
  validateBuyer,
  validateAuction,
  validateOthers,
};
