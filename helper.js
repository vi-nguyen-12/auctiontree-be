const User = require("./model/User");
const sgMail = require("@sendgrid/mail");
const { LookoutMetrics } = require("aws-sdk");

const sendEmail = ({ email, subject, text }) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const msg = {
    to: email,
    from: "info@auction10x.com",
    subject,
    text,
  };
  sgMail
    .send(msg)
    .then(() => {
      console.log("Email sent");
    })
    .catch((error) => {
      console.error(error);
    });
};

const changeToBidderId = (userId) => {
  return "BID" + userId;
};

const getBidsInformation = (bids, startingBid) => {
  const numberOfBids = bids.length;
  const highestBid = bids.length === 0 ? startingBid : bids.slice(-1)[0].amount;
  let highestBidders = bids.slice(-5);
  highestBidders = highestBidders.map(async (bidder) => {
    const user = await User.findById(bidder.userId);
    bidder.userName = user.userName;
  });
  return { numberOfBids, highestBid, highestBidders };
};
module.exports = { sendEmail, changeToBidderId, getBidsInformation };
