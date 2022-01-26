const User = require("./model/User");
const sgMail = require("@sendgrid/mail");

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

const getBidsInformation = async (bids, startingBid) => {
  const numberOfBids = bids.length;
  const highestBid = bids.length === 0 ? startingBid : bids.slice(-1)[0].amount;
  let highestBidders = bids.slice(-5);
  console.log(highestBidders);

  highestBidders = await Promise.all(
    highestBidders.map(async (bidder) => {
      const user = await User.findById(bidder.userId);
      console.log(user);
      return {
        amount: bidder.amount,
        time: bidder.time,
        userName: user.userName,
      };
    })
  );
  return { numberOfBids, highestBid, highestBidders };
};
module.exports = { sendEmail, getBidsInformation };
