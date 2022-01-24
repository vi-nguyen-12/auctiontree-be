const User = require("../model/User");
const Buyer = require("../model/Buyer");
const Property = require("../model/Property");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const sgMail = require("@sendgrid/mail");
const { sendEmail } = require("../helper");

//@desc  Register a new user & create secret
//@route POST /api/users/register
const registerUser = async (req, res) => {
  try {
    const userExist = await User.findOne({
      $or: [{ email: req.body.email }, { userName: req.body.userName }],
    });
    if (userExist) {
      return res
        .status(200)
        .send({ error: "Email or user name is already exists" });
    }

    const salt = await bcrypt.genSaltSync(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    const secret = speakeasy.generateSecret();
    const token = speakeasy.totp({
      secret: secret.secret.base32,
      encoding: "base32",
      time: 300,
    });
    const user = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      password: hashedPassword,
      userName: req.body.userName,
      country: req.body.country,
      city: req.body.city,
      secret,
      temp_token: token,
    });
    const savedUser = await user.save();
    sendEmail({
      email: user.email,
      subject: "Auction 10X- Confirm email",
      text: `Please click here to confirm your email: http://localhost:3000/confirm_email&?token=${token}`,
    });
    res.status(200).send({
      userId: savedUser._id,
      message: "Confirm link sent successfully",
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// @desc  Verify token and activate user
// @route POST /api/users/confirmation/verify body {token}
const verify = async (req, res) => {
  const { token } = req.body;
  try {
    const user = await User.findOne({ temp_token: token });
    if (!user) {
      return res.status(200).send({ error: "Invalid or expired token" });
    }
    const { base32: secret } = user.secret;

    const verified = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      time: 300,
    });
    if (!verified) {
      const token = speakeasy.totp({
        secret: user.secret.base32,
        encoding: "base32",
        time: 300,
      });
      return res.status(200).send({ error: "Invalid or expired token" });
    }
    user.isActive = true;
    user.temp_token = undefined;
    await user.save();

    sendEmail({
      email: user.email,
      subject: "Auction 10X Successful Registration",
      text: `Hi ${user.firstName} ${user.lastName}, We are delighted to have you join us. Welcome to AUCTION10X. Your email has been successfully verified. Thanks. The Auction10X Team`,
    });

    return res.status(200).send({
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
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

// @desc  Resend link to confirm email
// @route POST /api/users/confirmation/email body {email}
const sendConfirmEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(200).send({ error: "Email not found" });
    const token = speakeasy.totp({
      secret: user.secret.base32,
      encoding: "base32",
      time: 300,
    });
    user.temp_token = token;
    const savedUser = await user.save();
    sendEmail({
      email: user.email,
      subject: "Auction 10X- Confirm email",
      text: `Please click here to confirm your email: http://localhost:3000/confirm_email?token=${token}`,
    });
    res.status(200).send({
      userId: savedUser._id,
      message: "Confirm link sent successfully",
    });
  } catch (err) {
    res.status(500).send(err.message);
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
    res.status(500).send(error.message);
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
      return res.status(200).send({ error: "Email is not found" });
    }

    const validPass = await bcrypt.compare(req.body.password, user.password);
    if (!validPass) {
      return res.status(200).send({ error: "Invalid email or password" });
    }
    if (!user.isActive) {
      return res.status(200).send({ error: "User has not been verified" });
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
    res.status(500).send(error.message);
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
      return res.status(200).send({ error: `No buyer found` });
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

//@desc  Get user based on propertyId
// @route GET /api/users/propertyId/:propertyId
const getUserByPropertyId = async (req, res) => {
  const { propertyId } = req.params;
  try {
    const property = await Property.findById(propertyId);
    if (!property) {
      return res
        .status(200)
        .send({ error: `No property found with id ${propertyId}` });
    }
    const user = await User.findById(property.createdBy);
    if (!user) {
      return res.status(200).send({
        error: `No user found for this property with id ${propertyId}`,
      });
    }
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

//@desc  Reset forgot password
//@route POST /api/users/password data:{email}
//@route POST /api/users/password data:{token, password}
//@route POST /api/users/password data:{old,new}

const resetForgotPassword = async (req, res) => {
  try {
    const { email, token, password } = req.body;
    if (email) {
      const user = await User.findOne({ email });
      if (!user)
        return res
          .status(200)
          .send({ error: "Email is not registed for an account" });
      const token = speakeasy.totp({
        secret: user.secret.base32,
        encoding: "base32",
        time: 300,
      });
      user.temp_token = token;
      await user.save();
      sendEmail({
        email,
        subject: "Auction10X- Reset password",
        text: `Please click here to reset password: http://localhost:3000/reset_password?token=${token}`,
      });
      return res.status(200).send({ message: "Reset link sent successfully" });
    }
    if (token & password) {
      const user = await User.findOne({ temp_token: token });
      if (!user) {
        return res.status(200).send({
          error: "Invalid or expired token",
        });
      }
      const { base32: secret } = user.secret;
      const verified = speakeasy.totp.verify({
        secret,
        encoding: "base32",
        token,
        time: 300,
      });
      if (!verified) {
        return res.status(200).send({
          error: "Invalid or expired token",
        });
      }
      const salt = await bcrypt.genSaltSync(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      user.password = hashedPassword;
      user.temp_token = undefined;
      await user.save();
      res.status(200).send({ message: "Reset password successfully" });
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
};

module.exports = {
  registerUser,
  login,
  logout,
  verify,
  getUserByBuyerId,
  getUserByPropertyId,
  checkJWT,
  resetForgotPassword,
  sendConfirmEmail,
};
