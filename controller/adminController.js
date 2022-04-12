const Admin = require("../model/Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

//@desc  Create a new admin
//@route POST /api/admins body={fullName,email,phone, password,location,role, department,image, designation,description}
const createAdmin = async (req, res) => {
  try {
    if (req.admin || req.admin.roles.includes("admin_create")) {
      const {
        fullName,
        email,
        phone,
        password,
        location,
        IPAddress,
        title,
        department,
        image,
        designation,
        description,
      } = req.body;

      const isEmailExist = await Admin.findOne({ email });
      const isPhoneExist = await Admin.findOne({ phone });
      if (isEmailExist) {
        return res.status(200).send({
          error: "Email already exist",
        });
      }
      if (isPhoneExist) {
        return res.status(200).send({ error: "Phone number already exist" });
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newAdmin = await Admin.create({
        fullName,
        email,
        phone,
        password: hashedPassword,
        location,
        IPAddress,
        title,
        department,
        image,
        designation,
        description,
      });
      return res.status(200).send({
        _id: newAdmin._id,
        fullName: newAdmin.fullName,
        email: newAdmin.email,
        phone: newAdmin.phone,
        location: newAdmin.location,
        title: newAdmin.title,
        department: newAdmin.department,
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
        "fullName title department"
      );
      return res.status(200).send({ message: "User Logged In", admin });
    } else {
      return res.status(200).send({ message: "User not logged in" });
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
};

//@desc  Edit an admin
//@route PUT /api/admins/:id body={fullName,email,phone, location,roles, department,image, designation,description}
const editAdmin = async (req, res) => {
  try {
    if (req.admin?.roles.includes("admin_edit")) {
      const {
        fullName,
        email,
        phone,
        location,
        IPAddress,
        title,
        roles,
        department,
        image,
        designation,
        description,
      } = req.body;
      const admin = await Admin.findOne({ _id: req.params.id });
      if (!admin) {
        return res.status(200).send({ error: "Admin not found" });
      }
      admin.fullName = fullName || admin.fullName;
      admin.email = email || admin.email;
      admin.phone = phone || admin.phone;
      admin.location = location || admin.location;
      admin.IPAddress = IPAddress || admin.IPAddress;
      admin.title = title || admin.title;
      admin.roles = roles || admin.roles;
      admin.department = department || admin.department;
      admin.image = image || admin.image;
      admin.designation = designation || admin.designation;
      admin.description = description || admin.description;
      const savedAdmin = await admin.save();
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
    if (req.admin?.roles.includes("admin_delete")) {
      await Buyer.deleteOne({ _id: req.params.id });
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
    if (req.admin?.roles.includes("admin_read")) {
      const admins = await Admin.find().select("-password");
      return res.status(200).send(admins);
    }
    res.status(200).send({ error: "Not allowed to view admin" });
  } catch (err) {
    return res.status(500).send(err.message);
  }
};
//@desc  Get all admin
//@route GET /api/admins/:id
const getAdmin = async (req, res) => {
  try {
    if (
      req.admin &&
      (req.admin.roles.includes("admin_read") ||
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

module.exports = {
  createAdmin,
  editAdmin,
  deleteAdmin,
  getAllAdmin,
  getAdmin,
  login,
  checkJWT,
};
