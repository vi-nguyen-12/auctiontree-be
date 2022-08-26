const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);
const Role = require("../model/Role");
const Permission = require("../model/Permission");

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

      for (let i of permissions) {
        const permission = await Permission.findOne({ name: i });
        if (!permission)
          return res.status(200).send({ error: `Permission ${i} not found` });
        if (permission.status === "deactivated")
          return res.status(200).send({
            error: `Permission ${i} is deactivated. Cannot assign to a role`,
          });
      }

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

//@desc  Get roles
//@route GET/api/roles&status=activated    //should add filter by name
const getRoles = async (req, res) => {
  try {
    if (req.admin?.permissions.includes("admin_read")) {
      const { department } = req.query;
      const bodySchema = Joi.object({
        status: Joi.string().optional().valid("activated", "deactivated"),
        department: Joi.string()
          .optional()
          .valid(
            "administration",
            "marketing",
            "business",
            "financial",
            "legal",
            "technical",
            "escrow"
          ),
      });
      const { error } = bodySchema.validate(req.body);
      if (error)
        return res.status(200).send({ error: error.details[0].message });

      let filter = {};
      if (department) {
        filter.department = department;
      }

      const roles = await Role.find(filter);
      return res.status(200).send(roles);
    }
    return res.status(200).send({ error: "Not allowed to get roles" });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//@desc  Edit a role
//@route GET/api/roles/:id
const editRole = async (req, res) => {
  try {
    if (req.admin?.permissions.includes("admin_edit")) {
      const { name, department, permissions } = req.body;
      let savedName;
      const bodySchema = Joi.object({
        name: Joi.string().optional(),
        department: Joi.string()
          .optional()
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
          .optional(),
      });
      const { error } = bodySchema.validate(req.body);
      if (error)
        return res.status(200).send({ error: error.details[0].message });

      const role = await Role.findById(req.params.id);
      if (!role) return res.status(200).send({ error: "Role not found" });

      if (name) {
        savedName = name.trim().toLowerCase().replace(" ", "_");
      }
      role.name = savedName || role.name;
      role.department = department || role.department;

      if (permissions) {
        const newAddedPermissions = permissions.filter(
          (i) => !role.permissions.includes(i)
        );
        for (let i of newAddedPermissions) {
          const permission = await Permission.findOne({ name: i });
          if (!permission)
            return res.status(200).send({ error: "Permission not found" });
          if (permission.status === "deactivated")
            return res.status(403).send({
              error: `Permission ${i} is deactivated. Cannot assign to a role`,
            });
        }
      }
      role.permissions = permissions || role.permissions;

      const savedRole = await role.save();
      return res.status(200).send(savedRole);
    }
    return res.status(200).send({ error: "Not allowed to create role" });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//@desc  Delete a role
//@route DELETE /api/roles/:id    //should check if anyone has this role, throw an error, and show list of admin has that roles, super admin has to change role, so that can delete
const deleteRole = async (req, res) => {
  try {
    if (req.admin?.permissions.includes("admin_delete")) {
      await Role.deleteOne({ _id: req.params.id });
      res.status(200).send({ message: "Role deleted successfully" });
    }
    return res.status(200).send({ error: "Not allowed to delete role" });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

module.exports = {
  createRole,
  getRoles,
  editRole,
  deleteRole,
};
