const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);
const Permission = require("../model/Permission");

//@desc  Create a permission
//@route POST /api/permissions body:{name}
const createPermission = async (req, res) => {
  try {
    const { name } = req.body;
    const bodySchema = Joi.object({
      name: Joi.string()
        .required()
        .valid(
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
        ),
    });
    const { error } = bodySchema.validate(req.body);
    if (error) return res.status(200).send({ error: error.details[0].message });

    const isPermissionExist = await Permission.findOne({ name });
    if (isPermissionExist)
      return res.status(200).send({ error: "Permission already exists" });
    const newPermission = await Permission.create({
      name,
    });
    return res.status(200).send(newPermission);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//@desc  Get all permissions  //should add filter by name
//@route GET /api/permissions?status=...
const getPermissions = async (req, res) => {
  try {
    if (req.admin?.permissions.includes("admin_read")) {
      const { status } = req.query;
      const querySchema = Joi.object({
        status: Joi.string().optional().valid("activated", "deactivated"),
      });
      const { error } = querySchema.validate(req.query);
      if (error)
        return res.status(200).send({ error: error.details[0].message });
      const filter = {};
      if (status) {
        filter.status = status;
      }
      const permissions = await Permission.find(filter);
      return res.status(200).send(permissions);
    }
    return res.status(200).send({ error: "Not allowed to get permissions" });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//@desc  Edit a permission
//@route PUT /api/permissions/:id body={status:...}
const editPermission = async (req, res) => {
  try {
    const { status } = req.body;
    if (req.admin?.permissions.includes("admin_edit")) {
      const bodySchema = Joi.object({
        status: Joi.string().optional().valid("activated", "deactivated"),
      });
      const { error } = bodySchema.validate(req.body);
      if (error)
        return res.status(200).send({ error: error.details[0].message });

      const permission = await Permission.findById(req.params.id);
      if (!permission)
        return res.status(200).send({ error: "Permission not found" });
      permission.status = status || permission.status;

      const savedPermission = await permission.save();
      return res.status(200).send(savedPermission);
    }
    return res.status(200).send({ error: "Not allowed to edit permission" });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

module.exports = {
  createPermission,
  getPermissions,
  editPermission,
};
