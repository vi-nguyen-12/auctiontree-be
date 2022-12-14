const Subscription = require("../model/Subscription");
const Joi = require("joi");
const { sendEmail } = require("../helper");

//@desc  Add a subscription
//@route POST /api/subscriptions body={email}
const addSubscription = async (req, res) => {
  try {
    const { email } = req.body;
    const bodySchema = Joi.object({
      email: Joi.string()
        .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } })
        .required(),
    });
    const { error } = bodySchema.validate(req.body);
    if (error) {
      return res.status(200).send({ error: error.details[0].message });
    }

    const isEmailExist = await Subscription.findOne({ email });
    if (isEmailExist) {
      return res
        .status(200)
        .send({ error: "Email already registered for subscription" });
    }
    const newSubscription = new Subscription({ email });
    const savedSubscription = await newSubscription.save();
    sendEmail({
      to: email,
      subject: "Auction Tree - Register for subscription",
      text: "Thank you for subscribing to Auction Tree. We will send you updates about the latest auctions.",
    });
    res.status(200).send(savedSubscription);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//@desc  Remove a subscription
//@route DELETE /api/subscriptions?email=...
const removeSubscription = async (req, res) => {
  try {
    const { email } = req.query;
    const querySchema = Joi.object({
      email: Joi.string()
        .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } })
        .required(),
    });
    const { error } = querySchema.validate(req.query);
    if (error) {
      return res.status(200).send({ error: error.details[0].message });
    }
    await Subscription.deleteOne({ email });
    sendEmail({
      to: email,
      subject: "Auction Tree - Unregister for subscription",
      text: "Your subscription has been removed from Auction Tree.",
    });
    res.status(200).send({ message: "Subscription removed successfully" });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

module.exports = { addSubscription, removeSubscription };
