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
      req.admin = { id: admin._id, roles: admin.roles }; //{id:..., roles:...}
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
        req.admin = { id: admin._id, roles: admin.roles };
        next();
      }
    }
  } catch (err) {
    next();
  }
};

module.exports = { auth, authNotStrict };
