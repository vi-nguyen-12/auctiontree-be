const router = require("express").Router();

router.post("/", async (req, res) => {
  const io = req.app.get("socket_io");
  const { number, auctionId } = req.body;
  console.log(number, auctionId);
  io.on("connection", (socket) => {
    socket.emit("connection", null);
    console.log(socket.id);
    socket.emit("bid", { number, auctionId });
    socket.on("disconnect", () => {
      console.log("user disconnected");
    });
  });
  res.status(200).send({ number, auctionId });
});

module.exports = router;
