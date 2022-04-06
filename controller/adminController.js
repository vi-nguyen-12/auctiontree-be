const Admin = require("../model/Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

//@desc  Create a new admin
//@route POST /api/admins body={fullName,email,phone, password,location,role, department,image, designation,description}
const createAdmin = async (req, res) => {
  try {
    if (!req.admin || !req.admin.roles.includes("admin_create")) {
      return res.status(200).send({ error: "Not allowed to create admin" });
    }
    const {
      fullName,
      email,
      phone,
      password,
      location,
      IPAddress,
      title,
      roles,
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
      roles,
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
      roles: newAdmin.roles,
      department: newAdmin.department,
      image: newAdmin.image,
      designation: newAdmin.designation,
      description: newAdmin.description,
    });
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
      res.status(200).send({ error: "Email not found" });
    }
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      res.status(200).send({ error: "Password is incorrect" });
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

//@desc  Edit an admin
//@route POST /api/admins/:id body={fullName,email,phone, location,role, department,image, designation,description}
const editAdmin = async (req, res) => {
  try {
    if (!req.admin || !req.admin.roles.includes("admin_edit")) {
      return res.status(200).send({ error: "Not allowed to edit admin" });
    }
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
  } catch (err) {
    res.status(500).send(err.message);
  }
};

module.exports = {
  createAdmin,
  editAdmin,
  login,
};
