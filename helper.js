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
module.exports = { sendEmail, changeToBidderId };
