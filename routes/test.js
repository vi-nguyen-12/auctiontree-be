const router = require("express").Router();
const Auction = require("../model/Auction.js");
const Buyer = require("../model/Buyer.js");
const Property = require("../model/Property.js");

router.get("/", async (req, res) => {
  const pendingProperties = await Property.aggregate([
    {
      $match: {
        step: { $in: [1, 2, 3, 4] },
        updatedAt: {
          $lte: new Date(new Date().setDate(new Date().getDate() - 15)),
          // $gte: new Date(new Date().setDate(new Date().getDate() - 16)),
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "createdBy",
        foreignField: "_id",
        as: "seller",
        pipeline: [
          {
            $project: {
              _id: "$_id",
              email: "$email",
              firstName: "$firstName",
              lastName: "$lastName",
            },
          },
        ],
      },
    },
    {
      $unwind: { path: "$seller" },
    },
    {
      $project: {
        _id: "$_id",
        seller: "$seller",
      },
    },
  ]);
  return res.status(200).send(pendingProperties);
});
module.exports = router;
