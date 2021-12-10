const Kyc = require("../model/kyc");
const User = require("../model/User");
const axios = require("axios");
const uuid = require("uuid/v4");
const sgMail = require("@sendgrid/mail");

//@desc  Verify user KYC
//@route GET /api/kyc/verifyKyc params:{userId:...}

const verifyKyc = async (req, res) => {
  let userId = req.user.userId;
  let resp;
  try {
    let ref = uuid();
    let data = {
      userReference: userId,
      customerInternalReference: ref,
      workflowId: 200,
      successUrl: process.env.KYC_SUCCESS_URL,
      errorUrl: process.env.KYC_ERROR_URL,
      callbackUrl: process.env.KYC_CALLBACK_URL,
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
    var kycDet = await Kyc.findOne({ userId });
    if (!kycDet) {
      resp = await jumio.post(baseUrl, data);
      console.log(resp);
      const kyc = new Kyc();
      kyc.userId = userId;
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
        await Kyc.updateOne({ userId }, { $set: { result: resp.data } });
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
    return res.send({
      error: true,
      status: 500,
      message: "Cannot get details. Error occurred",
    });
  }
};
const callback = async (req, res) => {
  try {
    let kyc = await KYC.findOneAnUpdate(
      { kycId: req.body.customerId },
      { status: req.body.verificationStatus, result: req.body }
    );

    if (req.body.verificationStatus === "APPROVED_VERIFIED") {
      let user = await User.findOneAndUpdate(
        { _id: req.body.customerId },
        { KYC: true }
      );
      let email = user.email;
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      const msg = {
        to: email,
        from: "info@auction10x.com",
        subject: "Auction 10X- KYC approved",
        text: `Thank you for completing KYC. Your ID is successfuly approved.`,
      };
      sgMail
        .send(msg)
        .then(() => {
          console.log("Email sent");
        })
        .catch((error) => {
          console.error(error);
        });
    }
  } catch (error) {
    return res
      .status(500)
      .send({ message: "Cannot get details. Error occurred" });
  }
};

module.exports = { verifyKyc, callback };
