const Joi = require("joi");

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
module.exports = { userSchema };
