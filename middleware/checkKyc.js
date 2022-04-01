const User = require("../model/User");
const Kyc = require("../model/Kyc");

const checkKyc = async (req, res, next) => {
  const user = await User.findOne({ _id: req.user.id });
  if (user.KYC) {
    next();
  } else {
    const kyc = await Kyc.findOne({ userId: req.user.id });
    if (!kyc) {
      return res.status(200).send({ error: "User not started Kyc yet" });
    }
    res.status(200).send({ error: `Kyc status: ${kyc.status}` });
  }
};
module.exports = { checkKyc };
