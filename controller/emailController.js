const { sendEmail, replaceEmailTemplate } = require("../helper");
const Admin = require("../model/Admin");
const User = require("../model/User");
const Role = require("../model/Role");
const Email = require("../model/Email");
const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);

const createEmail = async (req, res) => {
  try {
    const {
      type,
      userId,
      name,
      email,
      phone,
      company,
      subject,
      content,
      autoReply,
    } = req.body;
    const bodySchema = Joi.object({
      type: Joi.string().required().valid("from_admin", "from_user"),
      userId: Joi.objectId(),
      name: Joi.when("type", {
        is: "from_user",
        then: Joi.when("userId", {
          is: Joi.exist(),
          then: Joi.string().allow(null),
          otherwise: Joi.string().required(),
        }),
        otherwise: Joi.string().allow(null),
      }),
      title: Joi.when("type", {
        is: "from_user",
        then: Joi.when("userId", {
          is: Joi.exist(),
          then: Joi.string().allow(null),
          otherwise: Joi.string().required(),
        }),
        otherwise: Joi.string().allow(null),
      }),
      company: Joi.when("type", {
        is: "from_user",
        then: Joi.when("userId", {
          is: Joi.exist(),
          then: Joi.string().allow(null),
          otherwise: Joi.string().optional(),
        }),
        otherwise: Joi.string().allow(null),
      }),
      email: Joi.when("userId", {
        is: Joi.exist(),
        then: Joi.string().allow(null),
        otherwise: Joi.string()
          .required()
          .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } }),
      }),
      phone: Joi.when("type", {
        is: "from_admin",
        then: Joi.when("userId", {
          is: Joi.exist(),
          then: Joi.string().allow(null),
          otherwise: Joi.string()
            .pattern(/^[0-9]+$/)
            .optional(),
        }),
        otherwise: Joi.string().allow(null),
      }),
      subject: Joi.string().required(),
      content: Joi.string().required(),
      autoReply: Joi.string()
        .valid("contact_us_reply", "partner_with_us_reply")
        .optional(),
    });

    const { error } = bodySchema.validate(req.body);
    if (error) {
      return res.status(200).send({ error: error.details[0].message });
    }

    if (type == "from_user") {
      //send to info@auctiontree.com
      // const role = await Role.findOne({ name: "general_admin" });
      const admins = await Admin.find({ email: "info@auctiontree.com" });
      let fromEmailAddress,
        toEmailAddresses,
        emailSubject,
        emailText,
        senderName;
      // toEmailAddresses = admins.map((item) => item.email);
      toEmailAddresses = ["info@auctiontree.com"];
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
          subject,
        });

        //set sender information
        senderName = `${user.firstName} ${user.lastName}`;

        //set email to admin
        fromEmailAddress = user.email;
        emailSubject = `New message from user about: ${subject}`;
        emailText = `${user.firstName} ${user.lastName} has sent a new message: "${content}"`;
      } else {
        await Email.create({
          sender: { name, phone, email, company },
          recipients: admins.map((item) => {
            return { _id: item._id };
          }),
          recipientsModel: "Admin",
          content,
          subject,
        });
        //set sender information
        senderName = `${name}`;

        //set email to admin
        fromEmailAddress = email;
        emailSubject = `New message from user about: ${subject}`;
        emailText = `${name} has sent a new message: "${content}"`;
      }

      //autoreply- send email to user
      if (autoReply) {
        let emailBody = await replaceEmailTemplate(autoReply, {
          name: senderName,
        });
        if (emailBody.error) {
          return res.status(200).send({ error: emailBody.error });
        }
        sendEmail({
          to: fromEmailAddress,
          subject: emailBody.subject,
          htmlText: emailBody.content,
        });
      }

      //send email to info@auctiontree.com
      sendEmail({
        // from: fromEmailAddress,
        to: toEmailAddresses,
        subject: emailSubject,
        text: emailText,
      });
      return res.status(200).send({ message: "Successfully sent message" });
    }
    if (type == "from_admin") {
      if (!req.admin) {
        return res.status(200).send({ error: "Not authorized to send email" });
      }
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
          subject,
          content,
        });

        sendEmail({
          from: admin.email.includes("@auctiontree.com") ? admin.email : null,
          to: user.email,
          subject,
          htmlText: content,
        });
      } else {
        await Email.create({
          sender: { _id: req.admin.id },
          senderModel: "Admin",
          recipients: [{ email }],
          recipientsModel: "User",
          subject,
          content,
        });

        sendEmail({
          from: admin.email.includes("@auctiontree.com") ? admin.email : null,
          to: email,
          subject,
          htmlText: content,
        });
      }
      return res.status(200).send({ message: "Successfully sent message" });
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
};
module.exports = { createEmail };
