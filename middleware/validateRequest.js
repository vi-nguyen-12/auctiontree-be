const Joi = require("joi").extend(require("@joi/date"));
Joi.objectId = require("joi-objectid")(Joi);

const validateUser = (req, res, next) => {
  let isAdmin = req.admin;
  const userSchema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string()
      .email({ minDomainSegments: 2, tlds: { allow: false } })
      .required(),
    phone: Joi.string()
      .pattern(/^[0-9]+$/)
      .required(),
    password: isAdmin ? Joi.string().optional() : Joi.string().required(),
    userName: Joi.string().required(),
    isBroker: Joi.number().valid(1, 0).required(),
  });
  const { error } = userSchema.validate(req.body);
  if (error) {
    return res.status(200).send({ error: error.details[0].message });
  }
  next();
};

const validateUpdateUser = (req, res, next) => {
  const userSchema = Joi.object({
    _id: Joi.objectId(),
    firstName: Joi.string(),
    lastName: Joi.string(),
    email: Joi.string().email({
      minDomainSegments: 2,
      tlds: { allow: ["com", "net"] },
    }),
    phone: Joi.string().pattern(/^[0-9]+$/),
    userName: Joi.string(),
    country: Joi.string(),
    city: Joi.string(),
    profileImage: Joi.string(),
    description: Joi.string(),
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
    isBroker: Joi.number().valid(1, 0),
    agent: Joi.object({
      isApproved: Joi.boolean().optional(),
      broker_licenses: Joi.array().items({
        _id: Joi.string().optional(),
        number: Joi.string().optional().allow("").allow(null),
        expired_date: Joi.string().optional().allow("").allow(null),
        state: Joi.string().optional().allow("").allow(null),
        document: Joi.object({
          name: Joi.string().optional().allow("").allow(null),
          url: Joi.string().optional().allow("").allow(null),
          isVerified: Joi.boolean().optional(),
        }),
      }),
    }),
    likedAuctions: Joi.array().items(Joi.string()),
    isActive: Joi.boolean(),
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
    answers: Joi.array()
      .items(
        Joi.object({
          questionId: Joi.objectId().required(),
          answer: Joi.string().valid("yes", "no").required(),
          explanation: Joi.when("answer", {
            is: Joi.string().valid("yes"),
            then: Joi.string().required(),
            otherwise: Joi.string().allow[(null, "")],
          }),
          files: Joi.when("answer", {
            is: Joi.string().valid("yes"),
            then: Joi.array()
              .required()
              .items(
                Joi.object({
                  name: Joi.string().required(),
                  url: Joi.string().required(),
                })
              ),
            otherwise: Joi.string().allow(null, ""),
          }),
        })
      )
      .required()
      .messages({
        "any.required": "Answers are required",
      }),
    documents: Joi.array()
      .items({
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
        // validity: Joi.date().iso().optional(),
        // isSelf: Joi.boolean().required(),
        // funderName: Joi.when("isSelf", {
        //   is: Joi.boolean().valid(false),
        //   then: Joi.string().required(),
        //   otherwise: Joi.forbidden(),
        // }),
        // providerName: Joi.when("isSelf", {
        //   is: Joi.boolean().valid(false),
        //   then: Joi.string().required(),
        //   otherwise: Joi.forbidden(),
        // }),
        // declaration: Joi.when("isSelf", {
        //   is: Joi.boolean().valid(false),
        //   then: Joi.object({
        //     time: Joi.date().iso().required(),
        //     IPAddress: Joi.string().required(),
        //   }),
        //   otherwise: Joi.forbidden(),
        // }),
        _id: Joi.string().optional(),
      })
      .required(),
    client: Joi.object({
      name: Joi.string().optional(),
      email: Joi.string().email().optional(),
      phone: Joi.string().optional(),
      documents: Joi.array().items({
        officialName: Joi.string().valid("power_of_attorney").required(),
        url: Joi.string().required(),
        name: Joi.string().required(),
      }),
    }).optional(),
    docusignId: Joi.objectId().required(),
    TC: Joi.object({
      time: Joi.date().iso().required(),
      IPAddress: Joi.string().required(),
    }).required(),
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
    startingBid: Joi.number()
      .required()
      .strict()
      .options({ convert: false })
      .options({ convert: false }),
    incrementAmount: Joi.number()
      .required()
      .strict()
      .options({ convert: false }),
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
      // broker_id: Joi.when("broker_name", {
      //   is: Joi.any().valid(null, ""),
      //   then: Joi.valid(null, "").optional(),
      //   otherwise: Joi.string().required(),
      // }),
      owner_email: Joi.string().email({
        minDomainSegments: 2,
        tlds: { allow: false },
      }),
      // .when("broker_name", {
      //   is: Joi.any().valid(null, ""),
      //   then: Joi.valid(null, "").optional(),
      //   otherwise: Joi.string().required(),
      // })
      owner_phone: Joi.string().pattern(/^[0-9]+$/),
      // Joi.when("broker_name", {
      //   is: Joi.any().valid(null, ""),
      //   then: Joi.valid(null, "").optional(),
      //   otherwise: Joi.string()
      //     .pattern(/^[0-9]+$/)
      //     .required(),
      // })
      address: Joi.string().required(),
      email: Joi.string().email({
        minDomainSegments: 2,
        tlds: { allow: ["com", "net"] },
      }),
      // .required()
      phone: Joi.string().pattern(/^[0-9]+$/),
      // .required()
      broker_documents: Joi.when("broker_name", {
        is: Joi.exist(),
        then: Joi.array()
          .items({
            officialName: Joi.string()
              .valid("listing_agreement", "power_of_attorney")
              .required(),
            name: Joi.string().required(),
            url: Joi.string().required(),
          })
          .required(),
        otherwise: Joi.array().optional(),
      }),
      broker_licenses: Joi.when("broker_name", {
        is: Joi.any().valid(null, ""),
        then: Joi.valid(null, "").optional(),
        otherwise: Joi.array()
          .required()
          .min(1)
          .items(
            Joi.object({
              _id: Joi.string().optional(),
              number: Joi.string().required(),
              expired_date: Joi.string().required(),
              state: Joi.string().required(),
            })
          ),
      }),
      // broker_license_number: Joi.when("broker_name", {
      //   is: Joi.any().valid(null, ""),
      //   then: Joi.valid(null, "").optional(),
      //   otherwise: Joi.string().required(),
      // }),
      // broker_license_expired_date: Joi.when("broker_name", {
      //   is: Joi.any().valid(null, ""),
      //   then: Joi.valid(null, "").optional(),
      //   otherwise: Joi.date().iso().required(),
      // }),
      // broker_license_state: Joi.when("broker_name", {
      //   is: Joi.any().valid(null, ""),
      //   then: Joi.valid(null, "").optional(),
      //   otherwise: Joi.string().required(),
      // }),

      ownership_type: Joi.object({
        name: Joi.string().required(),
        // .valid("individual", "joint", "corporate", "trust", "others"),
        // secondary_owner: Joi.when("name", {
        //   is: Joi.valid("joint"),
        //   then: Joi.string().required(),
        //   otherwise: Joi.valid(null, "").optional(),
        // }),
        // corporate_name: Joi.when("name", {
        //   is: Joi.valid("corporate"),
        //   then: Joi.string().required(),
        //   otherwise: Joi.valid(null, "").optional(),
        // }),
        // trust_name: Joi.when("name", {
        //   is: Joi.valid("trust"),
        //   then: Joi.string().required(),
        //   otherwise: Joi.valid(null, "").optional(),
        // }),
        secondary_owner: Joi.string().optional(),
        corporate_name: Joi.string().optional(),
        trust_name: Joi.string().optional(),
      }).required(),
      // company: Joi.object({
      //   company_name: Joi.string().optional(),
      //   website: Joi.string().optional(),
      // }).required(),
      co_broker: Joi.when("name", {
        is: Joi.exist(),
        then: Joi.array()
          .items({
            name: Joi.string().required(),
            email: Joi.string()
              .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } })
              .required(),
            phone: Joi.string()
              .pattern(/^[0-9]+$/)
              .required(),
            is_secondary: Joi.boolean().required(),
          })
          .required(),
        otherwise: Joi.array().optional(),
      }),
    }).required(),
    step: Joi.number().required().valid(1).options({ convert: false }),
  },
  step2: {
    "real-estate": {
      street_address: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      zip_code: Joi.string().required(),
      country: Joi.string().required(),
      lat: Joi.number().required(),
      lng: Joi.number().required(),
      real_estate_type: Joi.string()
        .required()
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
          "penthouse",
          "condo",
          "co_op",
          "land",
          "castle",
          "chateau",
          "farm_ranch",
          "private_island"
        ),
      year_built: Joi.number().required().options({ convert: false }),
      owner_name: Joi.string().required(),
      beds_count: Joi.number().required().options({ convert: false }),
      baths_count: Joi.number().required().options({ convert: false }),
      total_value: Joi.number().required().options({ convert: false }),
      area_sq_ft: Joi.number().required().options({ convert: false }),
      lot_size: Joi.number().required().options({ convert: false }),
      type_of_garage: Joi.string().required(),
      number_of_stories: Joi.number().required().options({ convert: false }),
      description: Joi.object({
        summary: Joi.string().required(),
        investment: Joi.string().allow(null, "").optional(),
        location: Joi.string().required(),
        market: Joi.string().required(),
      }).required(),
      reservedAmount: Joi.number().required().options({ convert: false }),
      discussedAmount: Joi.number().required().options({ convert: false }),
      // currency: Joi.string().required().valid("USD", "INR"),
      step: Joi.number().required().valid(2).options({ convert: false }),
    },
    car: {
      make: Joi.string().required(),
      // .valid(
      //   "ferrari",
      //   "aston_martin",
      //   "rolls_royce",
      //   "bugatti",
      //   "pagani",
      //   "koenig",
      //   "lamborghini",
      //   "w_motors",
      //   "mercedes",
      //   "mc_laren_elva",
      //   "zenvo",
      //   "bentley",
      //   "gordon_murray",
      //   "czinger",
      //   "mazzanti"
      // )
      model: Joi.string().required(),
      year: Joi.date().format("YYYY").required(),
      gearbox: Joi.string().required(),
      mileage: Joi.number().required().options({ convert: false }),
      car_type: Joi.string().required(),
      power: Joi.string().required(),
      color: Joi.string().required(),
      VIN: Joi.string().required(),
      engine: Joi.string().required(),
      fuel_type: Joi.string().required(),
      condition: Joi.string().required().valid("used", "new"),
      market_price: Joi.number().required().options({ convert: false }),
      description: Joi.object({
        summary: Joi.string().required(),
        investment: Joi.string().allow("", null).optional(),
        location: Joi.string().required(),
        market: Joi.string().required(),
      }).required(),
      property_address: Joi.object({
        formatted_street_address: Joi.string().required(),
        city: Joi.string().required(),
        state: Joi.string().required(),
        zip_code: Joi.string().required(),
        country: Joi.string().required(),
        lat: Joi.number().required().options({ convert: false }),
        lng: Joi.number().required().options({ convert: false }),
      }).required(),
      reservedAmount: Joi.number().required().options({ convert: false }),
      discussedAmount: Joi.number().required().options({ convert: false }),
      // currency: Joi.string().required().valid("USD", "INR"),
      step: Joi.number().required().valid(2).options({ convert: false }),
    },
    yacht: {
      vessel_registration_number: Joi.string().required(),
      vessel_manufacturing_date: Joi.date().required(),
      manufacture_mark: Joi.string().required(),
      manufacturer_name: Joi.string().required(),
      engine_type: Joi.string().required(),
      engine_manufacture_name: Joi.string().required(),
      engine_deck_type: Joi.string().required(),
      running_cost: Joi.number().required().options({ convert: false }),
      no_of_crew_required: Joi.number().required().options({ convert: false }),
      length: Joi.number().required().options({ convert: false }),
      others: Joi.string().optional(),
      description: Joi.object({
        summary: Joi.string().required(),
        investment: Joi.string().allow(null, "").optional(),
        location: Joi.string().required(),
        market: Joi.string().required(),
      }).required(),
      property_address: Joi.object({
        formatted_street_address: Joi.string().required(),
        city: Joi.string().required(),
        state: Joi.string().required(),
        zip_code: Joi.string().required(),
        country: Joi.string().required(),
        lat: Joi.number().required().options({ convert: false }),
        lng: Joi.number().required().options({ convert: false }),
      }).required(),
      reservedAmount: Joi.number().required().options({ convert: false }),
      discussedAmount: Joi.number().required().options({ convert: false }),
      // currency: Joi.string().required().valid("USD", "INR"),
      step: Joi.number().required().valid(2).options({ convert: false }),
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
      imported_aircraft: Joi.boolean().required(),
      year_built: Joi.date().format("YYYY").required(),
      description: Joi.object({
        summary: Joi.string().required(),
        investment: Joi.string().allow(null, "").optional(),
        location: Joi.string().required(),
        market: Joi.string().required(),
      }).required(),
      property_address: Joi.object({
        formatted_street_address: Joi.string().required(),
        city: Joi.string().required(),
        state: Joi.string().required(),
        zip_code: Joi.string().required(),
        country: Joi.string().required(),
        lat: Joi.number().required().options({ convert: false }),
        lng: Joi.number().required().options({ convert: false }),
      }).required(),
      reservedAmount: Joi.number().required().options({ convert: false }),
      discussedAmount: Joi.number().required().options({ convert: false }),
      // currency: Joi.string().required().valid("USD", "INR"),
      step: Joi.number().required().valid(2).options({ convert: false }),
    },
  },
  step3: {
    images: Joi.array()
      .items(
        Joi.object({
          _id: Joi.string().optional(),
          name: Joi.string().required(),
          url: Joi.string().required(),
          isVerified: Joi.string().optional(),
          isMain: Joi.boolean().optional(),
        })
      )
      .min(1)
      .required(),
    videos: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        url: Joi.string().required(),
        isVerified: Joi.string().optional(),
        _id: Joi.string().optional(),
      })
    ),
    step: Joi.number().required().valid(3).options({ convert: false }),
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
            isVerified: Joi.string().optional(),
            _id: Joi.string().optional(),
            isVisible: Joi.boolean().optional(),
          })
        )
        .required(),
      step: Joi.number().required().valid(4).options({ convert: false }),
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
          isVerified: Joi.string().optional(),
          _id: Joi.string().optional(),
          isVisible: Joi.boolean().optional(),
        })
        .required(),
      step: Joi.number().required().valid(4).options({ convert: false }),
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
          isVerified: Joi.string().optional(),
          _id: Joi.string().optional(),
          isVisible: Joi.boolean().optional(),
        })
        .required(),
      step: Joi.number().required().valid(4).options({ convert: false }),
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
          isVerified: Joi.string().optional(),
          _id: Joi.string().optional(),
          isVisible: Joi.boolean().optional(),
        })
        .required(),
      step: Joi.number().required().valid(4).options({ convert: false }),
    },
  },
  step5: {
    docusignId: Joi.objectId().optional(),
    step: Joi.number().required().valid(5).options({ convert: false }),
  },
};

const validateAdmin = (req, res, next) => {
  const adminSchema = Joi.object({
    fullName: Joi.string().required(),
    email: Joi.string()
      .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } })
      .required(),
    personalEmail: Joi.string()
      .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } })
      .required(),
    phone: Joi.string()
      .pattern(/^[0-9]+$/)
      .optional(),
    location: Joi.string().optional(),
    IPAddress: Joi.string().optional(),
    role: Joi.objectId().required(),
    permissions: Joi.array()
      .items(
        Joi.string().valid(
          "admin_delete",
          "admin_edit",
          "admin_create",
          "admin_read",
          "auction_delete",
          "auction_edit",
          "auction_create",
          "auction_read",
          "auction_winner_edit",
          "auction_winner_read",
          "property_delete",
          "property_edit",
          "property_create",
          "property_read",
          "property_img_video_approval",
          "property_document_approval",
          "property_approval",
          "buyer_delete",
          "buyer_edit",
          "buyer_create",
          "buyer_read",
          "buyer_document_approval",
          "buyer_answer_approval",
          "buyer_approval"
        )
      )
      .optional(),
    image: Joi.string().optional(),
    designation: Joi.string().optional(),
    description: Joi.string().optional(),
  });
  const { error } = adminSchema.validate(req.body);
  if (error) {
    return res.status(200).send({ error: error.details[0].message });
  }
  next();
};
module.exports = {
  validateUser,
  validateUpdateUser,
  validateBuyer,
  validateAuction,
  propertyObjectSchema,
  validateAdmin,
};
