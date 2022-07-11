const sgMail = require("@sendgrid/mail");
const EmailTemplate = require("./model/EmailTemplate");

const sendEmail = ({ from, to, subject, text }) => {
  console.log(from, to, subject, text);
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const msg = {
    to,
    from: from || "auction3x@gmail.com",
    subject,
    text, //for html text use html instead of text
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

const replaceEmailTemplate = async (emailTemplateType, replacedObject) => {
  try {
    const emailTemplate = await EmailTemplate.findOne({
      type: emailTemplateType,
    });

    if (!emailTemplate) {
      return { error: "Email template not found" };
    }
    let result = emailTemplate.content;
    const keys = Object.keys(replacedObject);
    for (let i of emailTemplate.replacedTexts) {
      if (keys.indexOf(i) === -1) {
        return { error: `Error: ${i} is needed for replacing email template` };
      } else {
        result = result.replace(`[${i}####]`, replacedObject[i]);
      }
    }
    return { subject: emailTemplate.subject, content: result };
  } catch (err) {
    return { error: `Error: ${err.message}` };
  }
};

module.exports = {
  sendEmail,
  getBidsInformation,
  generateRandomString,
  replaceEmailTemplate,
};
