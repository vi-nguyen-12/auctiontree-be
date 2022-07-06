const { sendEmail } = require("../helper");
const Admin = require("../model/Admin");
const Joi = require("joi");

// @desc receive contact message and send to admin
// @route POST /admin/contacts {firstName, lastName, location, email, phone, message}
const sendEmailToAdmin = async (req, res) => {
  try {
    const { firstName, lastName, location, email, phone, message } = req.body;
    const bodySchema = Joi.object({
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      // location: Joi.string().required(),
      email: Joi.string()
        .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } })
        .required(),
      phone: Joi.string()
        .pattern(/^[0-9]+$/)
        .required(),
      message: Joi.string().required(),
    });
    const { error } = bodySchema.validate(req.body);
    if (error) {
      return res.status(200).send({ error: error.details[0].message });
    }

    const generalAdmin = await Admin.findOne({ title: "general_admin" }).select(
      "email"
    );

    sendEmail({
      to: generalAdmin.email,
      subject: "Auction 3X- New message",
      text: `Received a new message from ${firstName} ${lastName} with email ${email} and phone ${phone} with the following message: ${message}`,
    });
    res.status(200).send({ message: "Email sent to admin successfully" });
  } catch (err) {
    res.status(500).send(err.message);
  }
};
module.exports = { sendEmailToAdmin };
