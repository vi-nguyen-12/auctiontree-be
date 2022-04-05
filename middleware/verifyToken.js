const jwt = require("jsonwebtoken");
const Admin = require("../model/Admin");

// user has to login as user or admin
const auth = async (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader) return res.status(401).send("Access Denied");
  try {
    const token = authHeader.split(" ")[1];
    const verified = jwt.verify(token, process.env.TOKEN_KEY);
    if (verified.userId) {
      req.user = { id: verified.userId }; //{id:...}
    }
    if (verified.adminId) {
      const admin = await Admin.findById(verified.adminId);
      req.admin = { id: admin._id, roles: admin.roles }; //{id:..., roles:...}
    }

    next();
  } catch (err) {
    res.status(400).send("Invalid Token");
  }
};

//user don't need to login
const authNotStrict = async (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader) {
    next();
  } else {
    const token = authHeader.split(" ")[1];
    const verified = jwt.verify(token, process.env.TOKEN_KEY);
    if (!verified) {
      next();
    }
    if (verified.userId) {
      req.user = { id: verified.userId }; //{id:...}
      next();
    }
    if (verified.adminId) {
      const admin = await Admin.findById(verified.adminId);
      req.admin = { id: admin._id, roles: admin.roles };
      next();
    }
  }
};

module.exports = { auth, authNotStrict };
