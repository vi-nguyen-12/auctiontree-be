const EmailTemplate = require("../model/EmailTemplate");
const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);

//@desc  Create a new email template
//@route POST /api/emailTemplates
const createEmailTemplate = async (req, res) => {
  try {
    const bodySchema = Joi.object({
      type: Joi.string()
        .required()
        .valid(
          "registration_confirm",
          "contact_us_reply",
          "reset_password",
          "customer_id_docs_approval",
          "customer_id_docs_rejected",
          "POF_approval",
          "POF_rejected",
          "KYC",
          "KYC_complete",
          "KYC_incomplete",
          "stripe_payment",
          "property_registration",
          "property_payment",
          "property_approval",
          "property_rejected",
          "property_auction",
          "RM_to_auction",
          "property_sold_at_auction",
          "seller_missing_document",
          "settlement_between_seller_and_buyer",
          "final_settlement",
          "register_to_bid",
          "deposited_won_property",
          "buyer_missing_document",
          "highest_bidder_notification",
          "escrow",
          "settlement_fees_and_balance",
          "winner_of_auction"
        ),
      subject: Joi.string().required(),
      content: Joi.string().required(),
    });
    const { error } = bodySchema.validate(req.body);
    if (error) {
      return res.status(200).send({ error: error.details[0].message });
    }

    const { type, subject, content } = req.body;
    const newEmailTemplate = new EmailTemplate({
      type,
      subject,
      content,
    });
    const savedEmailTemplate = await newEmailTemplate.save();
    return res.status(200).send(savedEmailTemplate);
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

//@desc  Edit a new email template
//@route PUT /api/emailTemplates/:id
const editEmailTemplate = async (req, res) => {
  try {
    const { type, subject, content } = req.body;
    const bodySchema = Joi.object({
      type: Joi.string()
        .required()
        .valid(
          "registration_confirm",
          "reset_password",
          "contact_us_reply",
          "customer_id_docs_approval",
          "customer_id_docs_rejected",
          "POF_approval",
          "POF_rejected",
          "KYC",
          "KYC_complete",
          "KYC_incomplete",
          "stripe_payment",
          "property_registration",
          "property_payment",
          "property_approval",
          "property_rejected",
          "property_auction",
          "RM_to_auction",
          "property_sold_at_auction",
          "seller_missing_document",
          "settlement_between_seller_and_buyer",
          "final_settlement",
          "register_to_bid",
          "deposited_won_property",
          "buyer_missing_document",
          "buyer_not_approved",
          "highest_bidder_notification",
          "escrow",
          "settlement_fees_and_balance",
          "winner_of_auction"
        ),
      subject: Joi.string().required(),
      content: Joi.string().required(),
    });
    const { error } = bodySchema.validate(req.body);
    if (error) {
      return res.status(200).send({ error: error.details[0].message });
    }
    const emailTemmplate = await EmailTemplate.findById(req.params.id);
    if (!emailTemmplate) {
      return res.status(200).send({ error: "Email template not found}" });
    }
    emailTemmplate.type = type;
    emailTemmplate.subject = subject;
    emailTemmplate.content = content;

    const updatedEmailTemplate = await emailTemmplate.save();

    return res.status(200).send(updatedEmailTemplate);
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

//@desc  Get all email templates
//@route GET /api/emailTemplates?type=...
const getEmailTemplates = async (req, res) => {
  try {
    const { type } = req.query;
    let filter = {};
    if (type) {
      filter.type = type;
    }
    const emailTemplates = await EmailTemplate.find(filter);
    return res.status(200).send(emailTemplates);
  } catch (err) {
    res.status(500).send(err);
  }
};

module.exports = { createEmailTemplate, editEmailTemplate, getEmailTemplates };
