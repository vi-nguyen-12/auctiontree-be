const Admin = require("../model/Admin");
const Role = require("../model/Role");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);
const { sendEmail, generateRandomString } = require("../helper");

const client_url =
  process.env.NODE_ENV === "production"
    ? process.env.PROD_CLIENT_ADMIN_URL
    : process.env.NODE_ENV === "test"
    ? process.env.TEST_CLIENT_ADMIN_URL
    : process.env.DEV_CLIENT_ADMIN_URL;
//@desc  Create a new admin
//@route POST /api/admins body={fullName,email,phone,location,role, department,image, designation,description}

const createAdmin = async (req, res) => {
  try {
    if (req.admin || req.admin.permissions.includes("admin_create")) {
      const {
        fullName,
        email,
        personalEmail,
        phone,
        location,
        IPAddress,
        role,
        permissions,
        image,
        designation,
        description,
      } = req.body;

      const isEmailExist = await Admin.findOne({ email });
      const isPhoneExist = await Admin.findOne({ phone });
      const isPersonalEmailExist = await Admin.findOne({ personalEmail });
      const isRoleExist = await Role.findById(role);

      if (isEmailExist)
        return res.status(200).send({
          error: "Email already exist",
        });

      if (isPhoneExist)
        return res.status(200).send({ error: "Phone number already exist" });

      if (isPersonalEmailExist)
        return res.status(200).send({ error: "Personal email already exist" });

      if (!isRoleExist)
        return res.status(200).send({ error: "Role is not found" });

      const password = generateRandomString(10);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newAdmin = await Admin.create({
        fullName,
        email,
        personalEmail,
        phone,
        password: hashedPassword,
        location,
        IPAddress,
        role,
        permissions: permissions || isRoleExist.permissions,
        image,
        designation,
        description,
      });
      sendEmail({
        to: newAdmin.personalEmail,
        subject: "Welcome to the team",
        text: `Please log in with this email ${newAdmin.email} and password ${password} to access your account and change your password as soon as possible. Thank you`,
      });

      return res.status(200).send({
        _id: newAdmin._id,
        fullName: newAdmin.fullName,
        email: newAdmin.email,
        personalEmail: newAdmin.personalEmail,
        phone: newAdmin.phone,
        location: newAdmin.location,
        role: newAdmin.role,
        department: newAdmin.department,
        permissions: newAdmin.permissions,
        image: newAdmin.image,
        designation: newAdmin.designation,
        description: newAdmin.description,
      });
    }
    res.status(200).send({ error: "Not allowed to create admin" });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//@desc  Admin login
//@route POST /api/admins/login  data:{email,password}
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(200).send({ error: "Email not found" });
    }
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(200).send({ error: "Password is incorrect" });
    }
    const token = jwt.sign({ adminId: admin._id }, process.env.TOKEN_KEY, {
      expiresIn: "5h",
    });
    res.status(200).send({
      message: "Login Successful",
      data: {
        _id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        department: admin.department,
        token,
      },
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//@desc  Check JWT
//@route POST /api/admins/checkJWT  body={authToken}
const checkJWT = async (req, res) => {
  try {
    const token = req.body.authToken;
    const verified = jwt.verify(token, process.env.TOKEN_KEY);
    if (verified) {
      const admin = await Admin.findOne({ _id: verified.adminId }).select(
        "fullName role department"
      );
      return res.status(200).send({ message: "User Logged In", admin });
    } else {
      return res.status(200).send({ message: "User not logged in" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send(error.message);
  }
};

//@desc  Edit an admin
//@route PUT /api/admins/:id body={fullName, personalEmail, email, phone, location,role, permissions, department,image, designation,description}
const editAdmin = async (req, res) => {
  try {
    //owner of this account
    if (req.admin?.id.toString() === req.params.id) {
      let {
        fullName,
        phone,
        personalEmail,
        location,
        image,
        oldPassword,
        newPassword,
      } = req.body;
      const querySchema = Joi.object({
        fullName: Joi.string().optional(),
        phone: Joi.string()
          .length(10)
          .pattern(/^[0-9]+$/)
          .optional(),
        personalEmail: Joi.string().email({
          minDomainSegments: 2,
          tlds: { allow: ["com", "net"] },
        }),
        location: Joi.string().optional(),
        image: Joi.string().optional(),
        oldPassword: Joi.string().optional(),
        newPassword: Joi.when("oldPassword", {
          is: Joi.exist(),
          then: Joi.string().required(),
          otherwise: Joi.string().allow(null),
        }),
      });
      const { error } = querySchema.validate(req.body);
      if (error)
        return res.status(200).send({ error: error.details[0].message });

      const admin = await Admin.findOne({ _id: req.admin.id });

      if (oldPassword) {
        const match = await bcrypt.compare(oldPassword, admin.password);
        if (!match) {
          return res
            .status(200)
            .send({ error: "Wrong password! Cannot update profile" });
        }
        const salt = await bcrypt.genSaltSync(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        admin.password = hashedPassword;
      }
      admin.fullName = fullName || admin.fullName;
      admin.phone = phone || admin.phone;
      admin.personalEmail = personalEmail || admin.personalEmail;
      admin.location = location || admin.location;
      admin.image = image || admin.image;

      const savedAdmin = await admin.save();
      const result = {
        _id: savedAdmin._id,
        fullName: savedAdmin.fullName,
        email: savedAdmin.email,
        personalEmail: savedAdmin.personalEmail,
        phone: savedAdmin.phone,
        location: savedAdmin.location,
        role: savedAdmin.role,
        permissions: savedAdmin.permissions,
        image: savedAdmin.image,
        designation: savedAdmin.designation,
        description: savedAdmin.description,
      };
      return res.status(200).send(result);
    }

    // admin
    if (req.admin?.permissions.includes("admin_edit")) {
      let {
        fullName,
        personalEmail,
        email,
        phone,
        location,
        IPAddress,
        role,
        permissions,
        image,
        designation,
        description,
      } = req.body;

      const querySchema = Joi.object({
        fullName: Joi.string().optional(),
        phone: Joi.string()
          .pattern(/^[0-9]+$/)
          .optional(),
        personalEmail: Joi.string().email({
          minDomainSegments: 2,
          tlds: { allow: ["com", "net"] },
        }),
        email: Joi.string().email({
          minDomainSegments: 2,
          tlds: { allow: ["com", "net"] },
        }),
        location: Joi.string().optional(),
        IPAddress: Joi.string().optional(),
        role: Joi.objectId().optional(),
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
        image: Joi.string().optional(),
        designation: Joi.string().optional(),
        description: Joi.string().optional(),
      });
      const { error } = querySchema.validate(req.body);
      if (error)
        return res.status(200).send({ error: error.details[0].message });

      let admin = await Admin.findOne({ _id: req.params.id });
      if (!admin) {
        return res.status(200).send({ error: "Admin not found" });
      }
      admin.fullName = fullName || admin.fullName;
      admin.personalEmail = personalEmail || admin.personalEmail;
      admin.email = email || admin.email;
      admin.phone = phone || admin.phone;
      admin.location = location || admin.location;
      admin.IPAddress = IPAddress || admin.IPAddress;
      admin.role = role || admin.role;
      admin.permissions = permissions || admin.permissions;
      admin.image = image || admin.image;
      admin.designation = designation || admin.designation;
      admin.description = description || admin.description;
      let savedAdmin = await admin.save();
      savedAdmin = savedAdmin.toObject();
      delete savedAdmin.password;
      return res.status(200).send(savedAdmin);
    }
    res.status(200).send({ error: "Not allowed to edit admin" });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//@desc  Delete an admin
//@route DELETE /api/admins/:id
const deleteAdmin = async (req, res) => {
  try {
    if (req.admin?.permissions.includes("admin_delete")) {
      await Admin.deleteOne({ _id: req.params.id });
      return res.status(200).send({ message: "Admin deleted successfully" });
    }
    res.status(200).send({ error: "Not allowed to delete admin" });
  } catch (err) {
    return res.status(500).send(err.message);
  }
};

//@desc  Get all admin
//@route GET /api/admins
const getAllAdmin = async (req, res) => {
  try {
    if (req.admin?.permissions.includes("admin_read")) {
      const { email, personalEmail, location, role } = req.query;
      let filter = {};
      if (email) {
        filter.email = email;
      }
      if (personalEmail) {
        filter.personalEmail = personalEmail;
      }
      if (location) {
        filter.location = location;
      }
      if (role) {
        filter.role = role;
      }

      const admins = await Admin.aggregate([
        { $match: filter },
        {
          $lookup: {
            from: "roles",
            localField: "role",
            foreignField: "_id",
            as: "role",
            pipeline: [
              {
                $project: {
                  name: "$name",
                  department: "$department",
                },
              },
            ],
          },
        },
        { $unwind: { path: "$role" } },
        {
          $project: {
            _id: "$_id",
            fullName: "$fullName",
            personalEmail: "$personalEmail",
            email: "$email",
            phone: "$phone",
            location: "$location",
            role: "$role.name",
            department: "role.department",
          },
        },
      ]);
      return res.status(200).send(admins);
    }
    res.status(200).send({ error: "Not allowed to view admin" });
  } catch (err) {
    return res.status(500).send(err.message);
  }
};

//@desc  Get an admin
//@route GET /api/admins/:id
const getAdmin = async (req, res) => {
  try {
    if (
      req.admin &&
      (req.admin.permissions.includes("admin_read") ||
        req.admin.id.toString() === req.params.id)
    ) {
      const admin = await Admin.findById(req.params.id).select("-password");
      if (!admin) {
        return res.status(200).send({ error: "Admin not found" });
      }
      return res.status(200).send(admin);
    }
    res.status(200).send({ error: "Not allowed to view admin" });
  } catch (err) {
    return res.status(500).send(err.message);
  }
};

//@desc  Forgot password/ Reset password
//@route PUT /api/admins/password body: {personalEmail, adminId}
//@route PUT /api/admins/password body {token, password}
const forgotPassword = async (req, res) => {
  try {
    //if owner of account
    const { personalEmail, token, password, adminId } = req.body;
    if (personalEmail) {
      const admin = await Admin.findOne({
        $or: [{ email: personalEmail }, { personalEmail }],
      });
      if (!admin) {
        return res
          .status(200)
          .send({ error: "Information for this email is not found" });
      }
      const token = jwt.sign({ userId: admin._id }, process.env.TOKEN_KEY, {
        expiresIn: "5m",
      });
      admin.temp_token = token;
      await admin.save();

      sendEmail({
        to: admin.personalEmail,
        subject: "Auction3X- Reset Password",
        text: `Please click in this link to reset your password: ${client_url}/reset-password?token=${token}`,
      });
      return res.status(200).send({ message: "Reset link sent successfully" });
    }
    if (token && password) {
      const admin = await Admin.findOne({ temp_token: token });
      if (!admin) {
        return res.status(200).send({ error: "Invalid or expired token" });
      }
      const verified = jwt.verify(token, process.env.TOKEN_KEY);
      if (!verified) {
        return res.status(200).send({ error: "Invalid or expired token" });
      }
      if (verified.userId.toString() !== admin._id.toString()) {
        return res.status(200).send({ error: "Invalid or expired token" });
      }
      const salt = await bcrypt.genSaltSync(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      admin.password = hashedPassword;
      admin.temp_token = undefined;
      await admin.save();
      return res.status(200).send({ message: "Reset password successfully" });
    }
    //if admin
    if (adminId) {
      if (req.admin?.permissions.includes("admin_edit")) {
        const admin = await Admin.findById(adminId);
        if (!admin) {
          return res.status(200).send({ error: "Admin not found" });
        }
        const password = generateRandomString(10);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        admin.password = hashedPassword;

        await admin.save();
        return res.status(200).send({ password });
      }
      return res
        .status(200)
        .send({ error: "Not allowed to reset admin password" });
    }
    return res.status(200).send("Please specify the fields of body");
  } catch (err) {
    return res.status(500).send(err.message);
  }
};
module.exports = {
  createAdmin,
  editAdmin,
  deleteAdmin,
  getAllAdmin,
  getAdmin,
  login,
  checkJWT,
  forgotPassword,
};
