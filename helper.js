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

const changeToBidderId = (userId) => {
  return "BID" + userId;
};

const getBidsInformation = (bids, startingBid) => {
  const numberOfBids = bids.length;
  const highestBid =
    bids.length === 0 ? startingBid : auction.bids.slice(-1)[0].amount;
  const highesBidders = bids.slice(-5);
  return { numberOfBids, highestBid, highesBidders };
};
module.exports = { sendEmail, changeToBidderId, getBidsInformation };
