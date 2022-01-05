const router = require("express").Router();

router.post("/", async (req, res) => {
  const { number, auctionId } = req.body;
  //check everything ok for this is the highest bid;
  // req.io.emit("bid", { number, auctionId });
  res.status(200).send({ number, auctionId });
});

module.exports = router;
