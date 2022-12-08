const router = require("express").Router();
const Auction = require("../model/Auction.js");
const Buyer = require("../model/Buyer.js");
const Property = require("../model/Property.js");
const Role = require("../model/Role.js");
const Admin = require("../model/Admin.js");
const { sendEmail } = require("../helper");

router.get("/", async (req, res) => {
  // let admins;
  sendEmail({
    to: "labs196test@yahoo.com",
    subject: "test",
    htmlText: `<p>Hello !</p><p>We are delighted to have you join us. Welcome to Auction Tree. Sell your property faster over the platform. Please click on the link to complete the registration process to confirm your account/confirm_email?token=</p><p>A unique user will be generated, please do not share the ID with other users.</p><p>This is temporary password: <strong></strong> </p><p>Please use this password and your personal email to log in and change your password.</p><p>Thanks,</p><p>The Auction Tree™ Team</p>`,
  });
  res.status(200).send({ message: "sent" });
});
module.exports = router;
