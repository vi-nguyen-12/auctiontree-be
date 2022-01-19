const User = require("../model/User");
const Buyer = require("../model/Buyer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const sgMail = require("@sendgrid/mail");
const { sendEmail } = require("../helper");

//@desc  Register a new user & create secret
//@route POST /api/user/register
const registerUser = async (req, res) => {
  const userExist = await User.findOne({
    $or: [{ email: req.body.userName }, { userName: req.body.userName }],
  });
  if (userExist) {
    return res.status(400).send("Email or user name is already exists");
  }

  const salt = await bcrypt.genSaltSync(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);
  const temp_secret = speakeasy.generateSecret();
  const user = new User({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    phone: req.body.phone,
    password: hashedPassword,
    userName: req.body.userName,
    country: req.body.country,
    city: req.body.city,
    secret: temp_secret,
  });

  try {
    const savedUser = await user.save();
    const token = speakeasy.totp({
      secret: savedUser.secret.base32,
      encoding: "base32",
      time: 300,
    });
    sendEmail({
      email: user.email,
      subject: "Auction 10X Register",
      text: `Verify Code: ${token}`,
    });
    res.send({ userId: savedUser._id, secret: savedUser.secret });
  } catch (err) {
    res.status(400).send(err.message);
  }
};

// @desc  Verify token and activate user
// @route POST /api/users/verify
const verify = async (req, res) => {
  const { token, email } = req.body;
  try {
    const user = await User.findOne({ email });
    const { base32: secret } = user.secret;

    const verified = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      time: 300,
    });

    if (verified) {
      user.isActive = true;
      await user.save();

      sendEmail({
        email: user.email,
        subject: "Auction 10X Successful Registration",
        text: `Hi ${user.firstName} ${user.lastName}, We are delighted to have you join us. Welcome to AUCTION10X. Your email has been successfully verified. Thanks. The Auction10X Team`,
      });

      return res.json({
        message: "User has been successfully verified",
        data: {
          _id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          userName: user.userName,
          email: user.email,
          phone: user.phone,
          country: user.country,
          city: user.city,
          isActive: user.isActive,
          KYC: user.isKYC,
        },
      });
    } else {
      return res.json({ message: "User has not verified yet" });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//@desc  Log in
//@route POST /api/users/login data:{userName,password}
const login = async (req, res) => {
  try {
    const user = await User.findOne({
      $or: [{ email: req.body.userName }, { userName: req.body.userName }],
    });

    if (!user) {
      return res.status(400).send("Email is not found");
    }

    const validPass = await bcrypt.compare(req.body.password, user.password);
    if (!validPass) {
      return res.status(400).send("Invalid password");
    }
    if (!user.isActive) {
      return res.status(200).send({ message: "User has not been verified" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.TOKEN_KEY, {
      expiresIn: "5h",
    });
    res.cookie("auth-token", token, {
      expires: new Date(Date.now() + 18000000),
      httpOnly: false,
      sameSite: "strict",
      secure: true,
    });

    res.status(200).send({
      message: "Login successful",
      data: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        userName: user.userName,
        country: user.country,
        city: user.city,
        isActive: user.isActive,
        KYC: user.isKYC,
      },
    });
  } catch (error) {
    res.status(400).send({ error });
  }
};

////@desc  Check JWT
//@route POST /api/users/verifyJWT data:{authToken}
const checkJWT = async (req, res) => {
  try {
    const token = req.body.authToken;
    const verified = jwt.verify(token, process.env.TOKEN_KEY);

    if (verified) {
      const user = await User.findOne({ _id: verified.userId });
      return res.status(200).send({ message: "User Logged In", user });
    } else {
      return res.status(200).send({ message: "User not logged in" });
    }
  } catch (error) {
    res.status(400).json(error);
  }
};

//@desc  Log out
//@route GET /api/users/logout
const logout = async (req, res) => {
  res.clearCookie("auth-token");
  res.redirect("/");
};

//@desc  Get user based on buyerId
// @route GET /api/users/buyerId/:buyerId
const getUserByBuyerId = async (req, res) => {
  const { buyerId } = req.params;
  try {
    const buyer = await Buyer.findById(buyerId);
    if (!buyer) {
      res.status(400).send("No buyer found with id " + buyerId);
    }
    const user = await User.findById(buyer.userId);
    const result = {
      _id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    };
    res.status(200).send(result);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//@desc  KYC is approved, send email notification
//@route POST /api/users/login

module.exports = {
  registerUser,
  login,
  logout,
  checkJWT,
  verify,
  getUserByBuyerId,
};
