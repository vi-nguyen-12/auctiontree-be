const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader) return res.status(401).send("Access Denied");
  try {
    const token = authHeader.split(" ")[1];
    const verified = jwt.verify(token, process.env.TOKEN_KEY);
    req.user = verified; //{userId:...}
    next();
  } catch (err) {
    res.status(400).send("Invalid Token");

    // const token = req.cookies["auth-token"];
    // console.log(token);
    // if (!token) return res.status(401).send("Access Denied");
    // try {
    //   const verified = jwt.verify(token, process.env.TOKEN_KEY);
    //   req.user = verified; //{userId:...}
    //   next();
    // } catch (err) {
    //   res.status(400).send("Invalid Token");
    // }
  }
};

module.exports = { auth };
