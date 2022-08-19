const jwt = require("jsonwebtoken");
const Admin = require("../model/Admin");

// user has to login as user or admin
const auth = async (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader) return res.status(200).send({ error: "Access Denied" });
  try {
    const token = authHeader.split(" ")[1];
    const verified = jwt.verify(token, process.env.TOKEN_KEY);
    if (verified.userId) {
      req.user = { id: verified.userId }; //{id:...}
    }
    if (verified.adminId) {
      const admin = await Admin.findById(verified.adminId);
      req.admin = { id: admin._id, permissions: admin.permissions }; //{id:..., permissions:...}
    }

    next();
  } catch (err) {
    res.status(200).send({ error: "Invalid Token" });
  }
};

//user don't need to login
const authNotStrict = async (req, res, next) => {
  const authHeader = req.header("Authorization");
  try {
    if (!authHeader) {
      next();
    } else {
      const token = authHeader.split(" ")[1];
      const verified = jwt.verify(token, process.env.TOKEN_KEY);
      if (verified.userId) {
        req.user = { id: verified.userId }; //{id:...}
        next();
      }
      if (verified.adminId) {
        const admin = await Admin.findById(verified.adminId);
        req.admin = { id: admin._id, permissions: admin.permissions };
        next();
      }
    }
  } catch (err) {
    next();
  }
};

// auth for only user
const authUser = (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader) return res.status(200).send({ error: "Access Denied" });
  try {
    const token = authHeader.split(" ")[1];
    const verified = jwt.verify(token, process.env.TOKEN_KEY);
    if (verified.userId) {
      req.user = { id: verified.userId }; //{id:...}
      next();
    } else {
      return res.status(200).send({ error: "Access Denied" });
    }
  } catch (err) {
    res.status(200).send({ error: "Invalid Token" });
  }
};

// auth for only admin
const authAdmin = async (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader) return res.status(200).send({ error: "Access Denied" });
  try {
    const token = authHeader.split(" ")[1];
    const verified = jwt.verify(token, process.env.TOKEN_KEY);
    if (verified.adminId) {
      const admin = await Admin.findById(verified.adminId);
      req.admin = { id: admin._id, permissions: admin.permissions };
      next();
    } else {
      return res.status(200).send({ error: "Access Denied" });
    }
  } catch (err) {
    res.status(200).send({ error: "Invalid Token" });
  }
};

module.exports = { auth, authNotStrict, authUser, authAdmin };
