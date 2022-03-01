const Joi = require("joi");
Joi.objectId = require("joi-objectId")(Joi);

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
    property: Joi.objectId().required(),
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
  validateProperty,
  validateBuyer,
  validateAuction,
};
