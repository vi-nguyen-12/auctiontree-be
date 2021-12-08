const Kyc = require("../model/kyc");
const User = require("../model/User");
const axios = require("axios");
const uuid = require("uuid/v4");

//@desc  Fetch user KYC status
//@route POST /api/user/fetchKycStatus data:{userId}

const fetchKycStatus = async (req, res) => {
  const user = await User.findById(req.query.userId);
  return res.status(200).json({ kyc_status: user.KYC });
};

//@desc  Verify user KYC
//@route POST /api/kyc/verifyKyc data:{userId}

const verifyKyc = async (req, res) => {
  let resp;
  try {
    let userId = req.query.userId;
    console.log(userId);
    if (!userId) {
      return res.send({
        error: true,
        message: "Invalid request",
      });
    }
    let ref = uuid();
    let data = {
      userReference: userId,
      customerInternalReference: ref,
      workflowId: 200,
      successUrl: process.env.KYC_SUCCESS_URL,
      errorUrl: process.env.KYC_ERROR_URL,
    };

    let token = `${process.env.KYC_USER_ID}:${process.env.KYC_PASS}`;
    let encodedToken = Buffer.from(token).toString("base64");
    let jumio = axios.create({
      headers: {
        Authorization: "Basic " + encodedToken,
        "User-Agent": "Tech196",
      },
    });

    let baseUrl = process.env.KYC_BASE_URL;
    let redirectUrl;
    var kycDet = await Kyc.findOne({ userId: userId });

    if (!kycDet) {
      resp = await jumio.post(baseUrl, data);
      const kyc = new Kyc();
      kyc.userId = userId;
      console.log(kyc.userId);
      kyc.kycId = "kyc_" + ref;
      kyc.status = "PENDING";
      kyc.result = resp.data;
      await kyc.save();
      redirectUrl = resp.data.redirectUrl;
    } else {
      let diff = new Date() - new Date(kycDet.result.timestamp);
      let minutes = Math.floor(diff / 1000 / 60);
      if (
        parseFloat(minutes) > process.env.KYC_TOKEN_EXPIRE_TIME &&
        kycDet.status == "PENDING"
      ) {
        resp = await jumio.post(baseUrl, data);
        await Kyc.updateOne(
          { userId: userId },
          { $set: { result: resp.data } }
        );
        redirectUrl = resp.data.redirectUrl;
      } else {
        redirectUrl = kycDet.result.redirectUrl;
      }
    }
    return res.send({
      success: true,
      url: redirectUrl,
    });
  } catch (error) {
    console.log(error);
    return res.send({
      error: true,
      status: 500,
      message: "Cannot get details. Error occurred",
    });
  }
};

const success = () => {};

exports.fetchKycStatus = fetchKycStatus;
exports.verifyKyc = verifyKyc;
