const router = require("express").Router();
const Auction = require("../model/Auction.js");
const Buyer = require("../model/Buyer.js");
const Property = require("../model/Property.js");
const Role = require("../model/Role.js");
const Admin = require("../model/Admin.js");

router.get("/", async (req, res) => {
  let admins;

  res.status(200).send(admins);
});
module.exports = router;
