const User = require("../model/User");
const Buyer = require("../model/Buyer");
const Property = require("../model/Property");
const Auction = require("../model/Auction");
const Kyc = require("../model/Kyc");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const { sendEmail } = require("../helper");

const client_url =
  process.env.NODE_ENV === "production"
    ? process.env.PROD_CLIENT_URL
    : process.env.DEV_CLIENT_URL;

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
      secret: secret.base32,
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
      text: `Please click here to confirm your email: ${client_url}/confirm_email&?token=${token}`,
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
      text: `Please click here to confirm your email: ${client_url}/confirm_email?token=${token}`,
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
      sameSite: "none",
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
        token,
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
  res.status(200).send({ message: "User logged out" });
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
        text: `Please click here to reset password: ${client_url}/reset_password?token=${token}`,
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

//deactivate user account and other related data,
//@route PUT /api/users/:id?suspended=true
//@route PUT /api/users/:id?suspended=false
const suspendUserAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(200).send({ error: "User not found" });
    const { suspended } = req.query;
    if (suspended === "true") {
      user.isSuspended = true;
      await User.save(user);
      return res.status(200).send({ message: "User is now suspended" });
    }
    if (suspended === "false") {
      user.isSuspended = false;
      await User.save();
      return res.status(200).send({ message: "User is now activated" });
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//delete user account and other related data, totally complete
//@route DELETE /api/users/:id
const deleteUserAccount = async (req, res) => {
  try {
    const { id: userId } = req.params;
    const deletedUser = await User.deleteOne({ _id: userId });
    if (deletedUser.deletedCount === 0) {
      return res.status(200).send({ error: "User not found" });
    }
    //delete Kyc
    await Kyc.deleteOne({ userId });

    //delete properties created by this user & related auctions
    const properties = await Property.find({ createdBy: userId });

    for (let property of properties) {
      await Auction.deleteOne({ property: property.id });
      await Property.deleteOne({ _id: property.id });
    }

    // delete buyers initiated by this user
    await Buyer.deleteMany({ userId });
    res.status(200).send({ message: "User account successfully deleted" });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//@desc  Get likedAuctions
//@route GET /api/users/:id/likes
const getLikedAuctions = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id })
      .select("likedAuctions")
      .populate({
        path: "likedAuctions",
        populate: {
          path: "property",
          select: "type details images",
        },
      });

    res.status(200).send(user.likedAuctions);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//@desc  Set a liked auction
//@route PUT /api/users/:id/likes/:auctionId
const setLikedAuction = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(200).send("User not found");

    const auctionId = await Auction.findById(req.params.auctionId);
    if (!auctionId) return res.status(200).send("Auction not found");

    let auctionExistsInLiked = user.likedAuctions.includes(auctionId);
    if (!auctionExistsInLiked) {
      user.likedAuctions.push(auctionId);
      await user.save();
    }
    return res.status(200).send("Successfully added auction to liked list");
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//@desc  Set an unliked auction
//@route DELETE /api/users/:id/likes/:auctionId
const setUnlikedAuction = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(200).send("User not found");

    const auctionId = await Auction.findById(req.params.auctionId);
    if (!auctionId) return res.status(200).send("Auction not found");

    user.likedAuctions.filter((item) => item !== auctionId);
    return res.status(200).send("Successfully remove auction from liked list");
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//@desc  Get bid auctions of a buyer
//@route GET /api/users/:id/buyer/bidAuctions
const getBidAuctionsOfBuyer = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(200).send("User not found");

    const bidAuctions = await Auction.find({
      "bids.userId": user._id,
    }).populate({ path: "property", select: "type details images" });

    res.status(200).send(bidAuctions);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

//@desc  Get approved auctions of a buyer
//@route GET /api/users/:id/buyer/approvedAuctions
const getApprovedAuctionsOfBuyer = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(200).send("User not found");

    const buyerApprovedList = await Buyer.find({
      userId: user._id,
      isApproved: "success",
    }).populate({
      path: "auctionId",
      select: "auctionId ",
      populate: {
        path: "property",
        select: "type details images",
      },
    });
    const result = buyerApprovedList.map((item) => {
      return item.auctionId;
    });
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

//@desc  Get win auctions of a buyer
//@route GET /api/users/:id/buyer/winAuctions
const getWinAuctionsOfBuyer = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(200).send("User not found");

    const result = await Auction.find({
      "winner.userId": user._id,
    }).populate({ path: "property", select: "type details images" });

    res.status(200).send(result);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

//@desc  Get approved auctions of a seller
//@route GET /api/users/:id/seller/approvedAuctions
const getApprovedAuctionsOfSeller = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(200).send("User not found");

    const approvedPropertyList = await Property.find({
      createdBy: user._id,
      isApproved: "success",
    }).select("_id");
    let auctions = [];
    if (approvedPropertyList.length !== 0) {
      auctions = await Auction.find({
        property: { $in: approvedPropertyList },
      }).populate({ path: "property", select: "type details images" });
    }
    res.status(200).send(auctions);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

//@desc  Get pending listings of a seller
//@route GET /api/users/:id/seller/pendingListings
const getPendingListingsOfSeller = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(200).send("User not found");

    const notApprovedPropertyList = await Property.find({
      createdBy: user._id,
      isApproved: { $in: ["pending", "fail"] },
    });

    res.status(200).send(notApprovedPropertyList);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

//@desc  Get pending listings of a seller
//@route GET /api/users/:id/seller/approvedListings
const getApprovedListingsOfSeller = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(200).send("User not found");

    const approvedPropertyList = await Property.find({
      createdBy: user._id,
      isApproved: "success",
    });

    res.status(200).send(approvedPropertyList);
  } catch (error) {
    res.status(500).send(error.message);
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
  suspendUserAccount,
  deleteUserAccount,
  getLikedAuctions,
  setLikedAuction,
  setUnlikedAuction,
  getBidAuctionsOfBuyer,
  getApprovedAuctionsOfBuyer,
  getWinAuctionsOfBuyer,
  getApprovedAuctionsOfSeller,
  getPendingListingsOfSeller,
  getApprovedListingsOfSeller,
};
