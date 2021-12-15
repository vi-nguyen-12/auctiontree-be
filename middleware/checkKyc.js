const User = require("../model/User");
const Kyc = require("../model/kyc");

const checkKyc = async (req, res, next) => {
  const user = await User.findOne({ _id: req.user.userId });
  if (user.KYC) {
    next();
  } else {
    const kyc = await Kyc.findOne({ userId: req.user.userId });
    if (!kyc) {
      return res.status(400).send("User not started Kyc yet");
    }
    res.status(400).send(`Kyc status: ${kyc.status}`);
  }
};
module.exports = { checkKyc };
