//@desc  A user start a chat
//@route PUT /api/auctions/:id/bidding   body:{biddingTime, biddingPrice }
const sendChat = async (req, res) => {
  try {
    // req.io.emit("bid", {
    //   auctionId: savedAuction._id,
    //   highestBid,
    //   numberOfBids,
    //   highestBidders,
    //   isReservedMet,
    // });
    res.status(200).send("test");
  } catch (err) {
    res.status(500).send(err.message);
  }
};

module.exports = {
  sendChat,
};

// get messages in time order
// let outcomingMessages = [
//   { content: "123", time: "2022-10-26T20:04:11.878Z" },
//   { content: "123", time: "2022-12-26T20:04:11.878Z" },
// ];
// let incomingMessages = [
//   { content: "4556", time: "2021-10-26T20:04:11.878Z", type: "incoming" },
//   { content: "4556", time: "2023-11-26T20:04:11.878Z", type: "incoming" },
// ];
// const n = outcomingMessages.length;
// const m = incomingMessages.length;
// let i = 0;
// let j = 0;
// console.log(outcomingMessages);
// while (i < n + j && j < m) {
//   if (outcomingMessages[i].time < incomingMessages[j].time) {
//     i += 1;
//     console.log(outcomingMessages);
//   } else {
//     outcomingMessages.splice(i, 0, incomingMessages[j]);
//     i += 1;
//     j += 1;
//   }
// }

// if (j < m) {
//   outcomingMessages = [...outcomingMessages, ...incomingMessages.slice(j)];
// }
