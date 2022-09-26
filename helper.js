const sgMail = require("@sendgrid/mail");
const nodemailer = require("nodemailer");
const EmailTemplate = require("./model/EmailTemplate");
const Buyer = require("./model/Buyer");

const sendEmail = ({ from, to, subject, text, htmlText }) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const msg = {
    to,
    from: from || "vienne@labs196.com",
    subject,
    text,
    html: htmlText,
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

//send email via smtp
// const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   from: "auction3x@gmail.com",
//   port: 465,
//   secure: true,
//   auth: {
//     user: "auction3x@gmail.com",
//     pass: "tzygnvhxzrxncioi",
//   },
// });

// const sendEmail = ({ from, to, subject, htmlText }) => {
//   transporter
//     .sendMail({
//       from: from || "auction3x@gmail.com",
//       to,
//       subject,
//       html: htmlText,
//     })
//     .then(() => {
//       console.log("Email sent");
//     })
//     .catch((error) => {
//       console.log(error);
//     });
// };

const getBidsInformation = async (bids, startingBid) => {
  const numberOfBids = bids.length;
  const highestBid = bids.length === 0 ? startingBid : bids.slice(-1)[0].amount;
  let highestBidders = bids.slice(-5);
  highestBidders = await Promise.all(
    highestBidders.map(async (bidder) => {
      let buyer = await Buyer.findById(bidder.buyerId).select("userId");
      return { ...bidder.toObject(), userId: buyer.userId.toString() };
    })
  );
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
        result = result.replace(`[${i}###]`, replacedObject[i]);
      }
    }
    return { subject: emailTemplate.subject, content: result };
  } catch (err) {
    return { error: `Error: ${err.message}` };
  }
};

const getGeneralAdmins = async () => {
  let role = await Role.findOne({ name: "general_admin" }).select("_id");
  admins = await Admin.find({ role: role._id }).select("email");
  return admins;
};

const addNotificationToAdmin = async (admins, message) => {
  for (let admin of admins) {
    admin.notifications.push({ message });
    await admin.save();
  }
};

module.exports = {
  sendEmail,
  getBidsInformation,
  generateRandomString,
  replaceEmailTemplate,
  getGeneralAdmins,
  addNotificationToAdmin,
};
