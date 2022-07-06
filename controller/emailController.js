const { sendEmail } = require("../helper");
const Admin = require("../model/Admin");
const User = require("../model/User");
const Email = require("../model/Email");
const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);

const createEmail = async (req, res) => {
  try {
    const {
      type,
      userId,
      firstName,
      lastName,
      email,
      phone,
      subject,
      content,
    } = req.body;

    const bodySchema = Joi.object({
      type: Joi.string().required().valid("from_admin", "from_user"),
      userId: Joi.objectId(),
      firstName: Joi.when("userId", {
        is: Joi.exist(),
        then: Joi.string().allow(null),
        otherwise: Joi.string().required(),
      }),
      lastName: Joi.when("userId", {
        is: Joi.exist(),
        then: Joi.string().allow(null),
        otherwise: Joi.string().required(),
      }),
      email: Joi.when("userId", {
        is: Joi.exist(),
        then: Joi.string().allow(null),
        otherwise: Joi.string()
          .required()
          .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } }),
      }),
      phone: Joi.when("userId", {
        is: Joi.exist(),
        then: Joi.string().allow(null),
        otherwise: Joi.string()
          .pattern(/^[0-9]+$/)
          .optional(),
      }),
      subject: Joi.string().required(),
      content: Joi.string().required(),
    });

    const { error } = bodySchema.validate(req.body);
    if (error) {
      return res.status(200).send({ error: error.details[0].message });
    }

    if (type == "from_user") {
      //find all who is general admin for now/ might change in the future
      const admins = await Admin.find({ title: "general_admin" }).select(
        "email"
      );

      if (userId) {
        const user = await User.findById(userId);
        if (!user) {
          return res.status(200).send({ error: "User not found" });
        }

        await Email.create({
          sender: { _id: user._id },
          senderModel: "User",
          recipients: admins.map((item) => {
            return { _id: item._id };
          }),
          recipientsModel: "Admin",
          content,
        });
        sendEmail({
          from: user.email,
          to: admins.map((item) => item.email),
          subject: `New message from user: ${subject}`,
          text: `${user.firstName} ${user.lastName} has sent a new message: "${content}"`,
        });
        return res.status(200).send({ message: "Successfully sent message" });
      } else {
        await Email.create({
          sender: { firstName, lastName, phone, email },
          recipients: admins.map((item) => {
            return { _id: item._id };
          }),
          recipientsModel: "Admin",
          content,
        });
        sendEmail({
          from: email,
          to: admins.map((item) => item.email),
          subject: `New message from user: ${subject}`,
          text: `${firstName} ${lastName} has sent a new message: "${content}"`,
        });
        return res.status(200).send({ message: "Successfully sent message" });
      }
    }
    if (type == "from_admin") {
      const admin = await Admin.findById(req.admin.id);
      if (userId) {
        const user = await User.findById(userId);
        if (!user) {
          return res.status(200).send({ error: "User not found" });
        }
        await Email.create({
          sender: { _id: req.admin.id },
          senderModel: "Admin",
          recipients: [{ _id: userId }],
          recipientsModel: "User",
          content,
        });

        sendEmail({
          from: admin.email,
          to: user.email,
          subject,
          text: content,
        });
      } else {
        await Email.create({
          sender: { _id: req.admin.id },
          senderModel: "Admin",
          recipients: [{ firstName, lastName, phone, email }],
          content,
        });
        sendEmail({
          to: admin.email,
          email,
          subject,
          text: content,
        });
      }
      return res.status(200).send({ message: "Successfully sent message" });
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
};
module.exports = { createEmail };
