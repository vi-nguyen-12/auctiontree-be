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
    social_links: Joi.object({
      facebook: Joi.string().allow("").allow(null),
      instagram: Joi.string().allow("").allow(null),
      twitter: Joi.string().allow("").allow(null),
    }),
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

const validateBuyer = (req, res, next) => {
  const buyerSchema = Joi.object({
    auctionId: Joi.objectId().required(),
    answers: Joi.array().items(
      Joi.object({
        questionId: Joi.objectId().required(),
        answer: Joi.string().valid("yes", "no").required(),
        explanation: Joi.when("answer", {
          is: Joi.string().valid("yes"),
          then: Joi.string().required(),
          otherwise: Joi.string().allow(null, ""),
        }),
      })
    ),
    documents: Joi.array()
      .items(
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
          validity: Joi.date().iso().optional(),
          isSelf: Joi.boolean().required(),
          funderName: Joi.when("isSelf", {
            is: Joi.boolean().valid(false),
            then: Joi.string().required(),
            otherwise: Joi.forbidden(),
          }),
          providerName: Joi.when("isSelf", {
            is: Joi.boolean().valid(false),
            then: Joi.string().required(),
            otherwise: Joi.forbidden(),
          }),
          declaration: Joi.when("isSelf", {
            is: Joi.boolean().valid(false),
            then: Joi.object({
              time: Joi.date().iso().required(),
              IPAddress: Joi.string().required(),
            }),
            otherwise: Joi.forbidden(),
          }),
        })
      )
      .required(),
    docusignId: Joi.objectId().required(),
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
    isFeatured: Joi.boolean().optional(),
  });
  const { error } = auctionSchema.validate(req.body);
  if (error) {
    return res.status(200).send({ error: error.details[0].message });
  }
  next();
};

const propertyObjectSchema = {
  step1: {
    type: Joi.string().valid("real-estate", "car", "yacht", "jet").required(),
    details: Joi.object({
      owner_name: Joi.string().required(),
      broker_name: Joi.string().allow("", null).optional(),
      broker_id: Joi.when("broker_name", {
        is: Joi.any().valid(null, ""),
        then: Joi.valid(null, "").optional(),
        otherwise: Joi.string().required(),
      }),
      address: Joi.string().required(),
      email: Joi.string()
        .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } })
        .required(),
      phone: Joi.string()
        .length(10)
        .pattern(/^\+[1-9]{1}[0-9]{3,14}$/)
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
      otherwise: Joi.array().optional(),
    }),
    step: Joi.number().required().valid(1),
  },
  step2: {
    "real-estate": {
      street_address: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      zip_code: Joi.string().regex(/^\d+$/).length(5).required(),
      country: Joi.string().required(),
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
    },
    car: {
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
      reservedAmount: Joi.number().required(),
      discussedAmount: Joi.number().required(),
      step: Joi.number().required().valid(2),
    },
    yacht: {
      vessel_registration_number: Joi.string().required(),
      vessel_manufacturing_date: Joi.date().required(),
      manufacture_mark: Joi.string().required(),
      manufacturer_name: Joi.string().required(),
      engine_type: Joi.string().required(),
      engine_manufacture_name: Joi.string().required(),
      engine_deck_type: Joi.string().required(),
      running_cost: Joi.number().required(),
      no_of_crew_required: Joi.number().required(),
      others: Joi.string().optional(),
      property_address: Joi.string().required(),
      reservedAmount: Joi.number().required(),
      discussedAmount: Joi.number().required(),
      step: Joi.number().required().valid(2),
    },
    jet: {
      registration_mark: Joi.string().required(),
      aircraft_builder_name: Joi.string().required(),
      aircraft_model_designation: Joi.string().required(),
      aircraft_serial_no: Joi.string().required(),
      engine_builder_name: Joi.string().required(),
      engine_model_designation: Joi.string().required(),
      number_of_engines: Joi.number().required(),
      propeller_builder_name: Joi.string().required(),
      propeller_model_designation: Joi.string().required(),
      number_of_aircraft: Joi.string().required(),
      imported_aircraft: Joi.boolean().required(),
      property_address: Joi.string().required(),
      reservedAmount: Joi.number().required(),
      discussedAmount: Joi.number().required(),
      step: Joi.number().required().valid(2),
    },
  },
  step3: {
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
  },
  step4: {
    "real-estate": {
      documents: Joi.array()
        .items(
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
                "listing_agreement",
                "others"
              )
              .required(),
            url: Joi.string().required(),
            name: Joi.string().required(),
          })
        )
        .required(),
      step: Joi.number().required().valid(4),
    },
    car: {
      documents: Joi.array()
        .items({
          officialName: Joi.string()
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
          name: Joi.string().required(),
          url: Joi.string().required(),
        })
        .required(),
      step: Joi.number().required().valid(4),
    },
    yacht: {
      documents: Joi.array()
        .items({
          officialName: Joi.string()
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
          name: Joi.string().required(),
          url: Joi.string().required(),
        })
        .required(),
      step: Joi.number().required().valid(4),
    },
    jet: {
      documents: Joi.array()
        .items({
          officialName: Joi.string()
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
          name: Joi.string().required(),
          url: Joi.string().required(),
        })
        .required(),
      step: Joi.number().required().valid(4),
    },
  },
  step5: {
    docusignId: Joi.objectId().required(),
    step: Joi.number().required().valid(5),
  },
};
module.exports = {
  validateUser,
  validateUpdateUser,
  validateBuyer,
  validateAuction,
  propertyObjectSchema,
};
