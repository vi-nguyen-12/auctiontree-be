const User = require("../model/User");
const Buyer = require("../model/Buyer");
const Property = require("../model/Property");
const Auction = require("../model/Auction");
const Kyc = require("../model/Kyc");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const { sendEmail } = require("../helper");
const Joi = require("joi");
const { getBidsInformation } = require("../helper");

const client_url =
  process.env.NODE_ENV === "production"
    ? process.env.PROD_CLIENT_URL
    : process.env.DEV_CLIENT_URL;

//@desc  Register a new user & create secret
//@route POST /api/users/register
const registerUser = async (req, res) => {
  try {
    const userExist = await User.findOne({
      $or: [
        { email: req.body.email.toLowerCase() },
        { userName: req.body.userName.toLowerCase() },
      ],
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
      agent: req.body.agent,
      secret,
      temp_token: token,
    });
    const savedUser = await user.save();
    sendEmail({
      email: user.email,
      subject: "Auction3- Confirm email",
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
      return res.status(200).send({ error: "Invalid or expired token" });
    }
    user.isActive = true;
    user.temp_token = undefined;
    await user.save();

    sendEmail({
      email: user.email,
      subject: "Auction3- Successful Registration",
      text: `Hi ${user.firstName} ${user.lastName}, We are delighted to have you join us. Welcome to AUCTION3. Your email has been successfully verified. Thanks. The Auction3 Team`,
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
    const user = await User.findOne({ email: email.toLowerCase() });
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
      subject: "Auction3- Confirm email",
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
//@route POST /api/users/checkJWT data:{authToken}
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
      $or: [
        { email: req.body.userName.toLowerCase() },
        { userName: req.body.userName.toLowerCase() },
      ],
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
        KYC: user.KYC,
        wallet: user.wallet,
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
      userName: user.userName,
      email: user.email,
      phone: user.phone,
      country: user.country,
      city: user.city,
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

const resetForgotPassword = async (req, res) => {
  try {
    const { email, token, password } = req.body;
    if (email) {
      const user = await User.findOne({ email: email.toLowerCase() });
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
        subject: "Auction3- Reset password",
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

//@desc  Edit profile
//@route PUT /api/users/:id body {firstName, lastName, email, phone, userName, country, city, old_password, new_password}
const editProfile = async (req, res) => {
  try {
    if (req.user?.id === req.params.id) {
      const {
        firstName,
        lastName,
        email,
        phone,
        userName,
        country,
        city,
        profileImage,
        social_links,
        old_password,
        new_password,
      } = req.body;

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(200).send({ error: "User not found" });
      }

      // check if email/ userName already exists
      if (email) {
        const emailExists = await User.findOne({ email: email.toLowerCase() });
        if (emailExists?._id.toString() !== user._id.toString()) {
          return res.status(200).send({ error: "Email already exists" });
        }
      }
      if (userName) {
        const userNameExists = await User.findOne({
          userName: userName.toLowerCase(),
        });
        if (userNameExists?._id.toString() !== user._id.toString()) {
          return res.status(200).send({ error: "UserName already exists" });
        }
      }
      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      user.email = email.toLowerCase() || user.email;
      user.phone = phone || user.phone;
      user.userName = userName.toLowerCase() || user.userName;
      user.country = country || user.country;
      user.city = city || user.city;
      user.profileImage = profileImage;
      user.social_links = social_links || user.social_links;

      // if change password
      if (old_password) {
        const match = await bcrypt.compare(old_password, user.password);
        if (!match) {
          return res
            .status(200)
            .send({ error: "Wrong password! Cannot update profile" });
        }
        const salt = await bcrypt.genSaltSync(10);
        const hashedPassword = await bcrypt.hash(new_password, salt);
        user.password = hashedPassword;
      }
      const savedUser = await user.save();
      const result = {
        _id: savedUser._id,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        email: savedUser.email,
        phone: savedUser.phone,
        userName: savedUser.userName,
        country: savedUser.country,
        city: savedUser.city,
        profileImage: savedUser.profileImage,
        social_links: savedUser.social_links,
      };
      return res.status(200).send(result);
    }
    res.status(200).send({ error: "Not allowed to edit profile" });
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
    if (req.user?.id === req.params.id) {
      const user = await User.findById(req.params.id)
        .select("likedAuctions")
        .populate({
          path: "likedAuctions",
          populate: {
            path: "property",
            select: "type details images",
          },
        });
      return res.status(200).send(user.likedAuctions);
    }
    res.status(200).send({ error: "Not allowed to get liked auctions" });
  } catch (err) {
    res.status(500).send(err.message);
  }
};
//@desc  Set a liked auction
//@route PUT /api/users/:id/:auctionId/liked
const setLikedAuction = async (req, res) => {
  try {
    if (req.user?.id === req.params.id) {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(200).send({ error: "User not found" });

      const auctionId = await Auction.findById(req.params.auctionId);
      if (!auctionId)
        return res.status(200).send({ error: "Auction not found" });

      let auctionExistsInLiked = user.likedAuctions.includes(auctionId);
      if (!auctionExistsInLiked) {
        user.likedAuctions.push(auctionId);
        await user.save();
      }
      return res
        .status(200)
        .send({ message: "Successfully added auction to liked list" });
    }
    res.status(200).send({ error: "Not allowed to set liked auction" });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//@desc  Set an unliked auction
//@route PUT /api/users/:id/:auctionId/unliked
const setUnlikedAuction = async (req, res) => {
  try {
    const { id: _id, auctionId } = req.params;
    if (req.user?.id === _id) {
      await User.updateOne({ _id }, { $pull: { likedAuctions: auctionId } });
      return res
        .status(200)
        .send({ message: "Successfully remove auction from liked list" });
    }
    res.status(200).send({ error: "Not allowed to set unliked auction" });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//@desc  Get bid auctions of a buyer
//@route GET /api/users/:id/buyer/auctions/bid
const getBidAuctionsOfBuyer = async (req, res) => {
  try {
    let id = req.params.id;
    if (
      (req.admin?.id && req.roles.includes("buyer_read")) ||
      (req.user?.id && req.user.id === id)
    ) {
      let bidAuctions = await Auction.find({ "bids.userId": id })
        .populate("property", "type details images")
        .select("-startingBid -incrementAmount -winner");
      bidAuctions = bidAuctions.map((auction) => {
        let [highestBid] = auction.bids.slice(-1);
        let bids = auction.bids.filter(
          (bid) => bid.userId.toString() === id.toString()
        );

        auction = { ...auction.toObject(), bids, highestBid };
        return auction;
      });
      return res.status(200).send(bidAuctions);
    }

    return res.status(200).send({ error: "Not allowed to get bid auctions" });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

//@desc  Get auctions of all buyers (grouped by user)
//@route GET /api/users/buyer/auctions
const getAuctionsOfAllBuyersGroupedByUser = async (req, res) => {
  try {
    const aggregate = await Buyer.aggregate([
      { $group: { _id: "$userId" } },
      {
        $lookup: {
          from: "buyers",
          localField: "_id",
          foreignField: "userId",
          pipeline: [
            {
              $project: {
                _id: "$auctionId",
                buyerId: "$_id",
                documents: "$documents",
                isApproved: "$isApproved",
                approvedFund: "$approvedFund",
              },
            },

            {
              $lookup: {
                from: "auctions",
                localField: "_id",
                foreignField: "_id",
                as: "auction",
                pipeline: [
                  {
                    $lookup: {
                      from: "properties",
                      localField: "property",
                      foreignField: "_id",
                      as: "property",
                      pipeline: [
                        {
                          $project: {
                            _id: "$_id",
                            type: "$type",
                            images: "$images",
                          },
                        },
                      ],
                    },
                  },
                  { $unwind: "$property" },
                ],
              },
            },
            { $addFields: { property: "$auction.property" } },
            { $unwind: "$property" },
            { $unset: "auction" },
          ],
          as: "auctions",
        },
      },
    ]);

    const result = await Promise.all(
      aggregate.map(async (item) => {
        const user = await User.findById(item._id).select(
          "firstName lastName userName phone email city country wallet"
        );

        item = { ...item, ...user.toObject() };
        const auctions = await Promise.all(
          item.auctions.map(async (item) => {
            const auction = await Auction.findById(item._id).select(
              "_id registerStartDate registerEndDate auctionStartDate auctionEndDate bids"
            );
            auction.bids = auction.bids
              .filter((item) => item.userId.toString() === user._id.toString())
              .map((item) => {
                item = item.toObject();
                delete item.userId;
                return item;
              });
            return { ...item, ...auction.toObject() };
          })
        );

        return { ...item, auctions };
      })
    );

    res.status(200).send(result);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

//@desc  Get auctions of a buyer
//@route GET /api/users/:id/buyer/auctions?status=...
const getAuctionsOfBuyer = async (req, res) => {
  try {
    const querySchema = Joi.object({
      status: Joi.string().valid("pending", "success", "fail").optional(),
    });
    const { error } = querySchema.validate(req.query);
    if (error) return res.status(200).send({ error: error.details[0].message });

    const { status } = req.query;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(200).send("User not found");

    let filter = { userId: user._id };
    if (status) {
      filter["isApproved"] = status;
    }
    const buyerApprovedList = await Buyer.find(filter)
      .select("auctionId answers documents isApproved approvedFund")
      .populate({
        path: "auctionId",
        select:
          "property startingBid incrementAmount registerStartDate registerEndDate auctionStartDate auctionEndDate bids",
        populate: {
          path: "property",
          select: "type details images ",
        },
      });
    //should check if admin return all bidders, if just a user return only 5 highest bidders

    const result = buyerApprovedList.map((buyer) => {
      return;
    });
    res.status(200).send(buyerApprovedList);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

//@desc  Get win auctions of a buyer
//@route GET /api/users/:id/buyer/winAuctions    //should changed to GET /api/users/:id/buyer/auctions/winner
const getWinAuctionsOfBuyer = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(200).send("User not found");

    const result = await Auction.aggregate([
      {
        $match: { "winner.userId": user._id },
      },
      {
        $lookup: {
          from: "properties",
          localField: "property",
          foreignField: "_id",
          as: "property",
          pipeline: [
            {
              $project: {
                _id: "$_id",
                type: "$type",
                details: "$details",
                images: "$images",
              },
            },
          ],
        },
      },
      {
        $project: {
          _id: "$_id",
          property: "$property",
          amount: "$winner.amount",
        },
      },
    ]);

    res.status(200).send(result);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

//@desc  Get auctions of a seller
//@route GET /api/users/:id/seller/auctions
const getAuctionsOfSeller = async (req, res) => {
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

//@desc  Get listings of a seller (completed and not completed)
//@route GET /api/users/:id/seller/properties?status= pending/fail/success & inAuction=true/false & completed=true/false
const getListingsOfSeller = async (req, res) => {
  try {
    const querySchema = Joi.object({
      status: Joi.string().valid("pending", "success", "fail").optional(),
      inAuction: Joi.string().valid("true", "false").optional(),
      completed: Joi.string().valid("true", "false").optional(),
      sold: Joi.string().valid("true", "false").optional(),
    });
    const { error } = querySchema.validate(req.query);
    if (error) return res.status(200).send({ error: error.details[0].message });

    const user = await User.findById(req.params.id);
    const { status, inAuction, completed, sold } = req.query;
    if (!user) return res.status(200).send("User not found");

    let filter = { createdBy: user._id };
    if (status) {
      filter["isApproved"] = status;
    }
    if (completed === "true") {
      filter["step"] = 5;
    }
    if (completed === "false") {
      filter["step"] = { $in: [1, 2, 3, 4] };
    }
    let listings = await Property.find(filter).select(
      "-createdBy -docusignId -createdAt"
    );

    listings = await Promise.all(
      listings.map(async (item) => {
        const result = await Auction.findOne({ property: item._id });
        if (result) {
          const { numberOfBids, highestBid, highestBidders } =
            getBidsInformation(result.bids, result.startingBid);
          item = item.toJSON();
          item["auctionDetails"] = {
            _id: result._id,
            startingBid: result.startingBid,
            incrementAmount: result.incrementAmount,
            registerStartDate: result.registerStartDate,
            registerEndDate: result.registerEndDate,
            auctionStartDate: result.auctionStartDate,
            auctionEndDate: result.auctionEndDate,
            numberOfBids,
            highestBid,
            highestBidders,
            winner: result.winner,
          };
        }
        return item;
      })
    );
    if (sold === "true") {
      listings = listings
        .filter((item) => item.auctionDetails?.winner?.userId)
        .map((item) => {
          delete item.isApproved;
          delete item.auctionDetails.startingBid;
          delete item.auctionDetails.incrementAmount;
          delete item.auctionDetails.registerStartDate;
          delete item.auctionDetails.registerEndDate;
          delete item.auctionDetails.numberOfBids;
          delete item.auctionDetails.highestBid;
          return item;
        });
      return res.status(200).send(listings);
    }
    if (inAuction === "true") {
      listings = listings.filter((item) => item.auctionDetails);
    }

    if (inAuction === "false") {
      listings = listings.filter((item) => !item.auctionDetails);
    }

    res.status(200).send(listings);
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
  getAuctionsOfBuyer,
  getWinAuctionsOfBuyer,
  getAuctionsOfSeller,
  getListingsOfSeller,
  editProfile,
  getAuctionsOfAllBuyersGroupedByUser,
};
