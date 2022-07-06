const sgMail = require("@sendgrid/mail");

const sendEmail = ({ from, to, subject, text }) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const msg = {
    to,
    from: from || "auction3x@gmail.com",
    subject,
    text,
  };
  sgMail
    .send(msg, true)
    .then(() => {
      console.log("Email sent");
    })
    .catch((error) => {
      console.error(error);
    });
};

const getBidsInformation = (bids, startingBid) => {
  const numberOfBids = bids.length;
  const highestBid = bids.length === 0 ? startingBid : bids.slice(-1)[0].amount;
  let highestBidders = bids.slice(-5);

  // highestBidders = await Promise.all(
  //   highestBidders.map(async (bidder) => {
  //     const user = await User.findById(bidder.userId);
  //     return {
  //       bidderId: bidder.userId,
  //       amount: bidder.amount,
  //       time: bidder.time,
  //       userName: user.userName,
  //     };
  //   })
  // );
  return { numberOfBids, highestBid, highestBidders };
};

const generateRandomString = (length) => {
  let randomString = "";
  let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let charsLength = chars.length;
  for (let i = 0; i < length; i++) {
    let randomNumber = Math.floor(Math.random() * charsLength);
    randomString += chars[randomNumber];
  }
  return randomString;
};

module.exports = { sendEmail, getBidsInformation, generateRandomString };
