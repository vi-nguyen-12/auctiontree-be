const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);
const Role = require("../model/Role");

//@desc  Create a role
//@route POST /api/roles body:{name, department,permissions}
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
          .required(),
      });
      const { error } = bodySchema.validate(req.body);
      if (error)
        return res.status(200).send({ error: error.details[0].message });

      const savedName = name.toLowerCase().trim().split(" ").join("_");
      const isNameExist = await Role.findOne({ name: savedName });
      if (isNameExist)
        return res.status(200).send({ error: "Role already exists" });
      const newRole = await Role.create({
        name: savedName,
        department,
        permissions,
      });
      return res.status(200).send(newRole);
    }
    return res.status(200).send({ error: "Not allowed to create role" });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

module.exports = {
  createRole,
};
