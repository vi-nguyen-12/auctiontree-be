const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);
const Buyer = require("../model/Buyer");
const User = require("../model/User");
const Question = require("../model/Question");
const Property = require("../model/Property");
const Auction = require("../model/Auction");
const Docusign = require("../model/Docusign");
const { sendEmail, replaceEmailTemplate } = require("../helper");

//@desc  Create a buyer
//@route POST /api/buyers body:{auctionId, docusignId,TC, answers:[{questionId, answer: "yes"/"no", explanation:"", documents:[{officialName:..., name:...,url:...}]}] } TC:{time: ISOString format, IPAddress:...}
const createRole = async (req, res) => {
  try {
    if (req.admin?.permissions.includes("admin_create")) {
      const { name, department, permissions } = req.body;
      const bodySchema = Joi.object({
        name: Joi.string().required(),
        department: Joi.string()
          .required()
          .valid(
            "administration",
            "marketing",
            "business",
            "financial",
            "legal",
            "technical",
            "escrow"
          ),
        permissions: Joi.array().items(
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
        ),
      });
      const { error } = bodySchema.validate(req.body);
      if (error)
        return res.status(200).send({ error: error.details[0].message });

      const newRole = await Role.create(req.body);
      return res.status(200).send(newRole);
    }
    return res.stpatus(200).send({ error: "Not allowed to create role" });
  } catch (err) {
    res.status(500).send(err);
  }
};

module.exports = {
  createRole,
};
