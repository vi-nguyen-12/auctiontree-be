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

  validateBuyer,
  validateAuction,
};
