const jwt = require("jsonwebtoken");
const Admin = require("../model/Admin");

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
      req.admin = { id: admin._id };
      req.role = { role: admin.role }; //{id:..., role:...}
    }

    next();
  } catch (err) {
    res.status(400).send("Invalid Token");
  }
};

module.exports = { auth };
