const User = require("../model/User");
const Buyer = require("../model/Buyer");
const Property = require("../model/Property");
const Auction = require("../model/Auction");
const Kyc = require("../model/Kyc");
const EmailTemplate = require("../model/EmailTemplate");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const Joi = require("joi");
const ObjectId = require("mongoose").Types.ObjectId;
const {
  sendEmail,
  getBidsInformation,
  replaceEmailTemplate,
  generateRandomString,
} = require("../helper");

const client_url =
  process.env.NODE_ENV === "production"
    ? process.env.PROD_CLIENT_URL
    : process.env.NODE_ENV === "test"
      ? process.env.TEST_CLIENT_URL
      : process.env.DEV_CLIENT_URL;

//@desc  Register a new user & create secret
//@route POST /api/users/register
const registerUser = async (req, res) => {
  try {
    let {
      firstName,
      lastName,
      email,
      phone,
      password,
      userName,
      country,
      city,
      agent,
    } = req.body;
    const userExist = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { userName: userName.toLowerCase() },
      ],
    });
    if (userExist) {
      return res
        .status(200)
        .send({ error: "Email or user name is already exists" });
    }

    // if admin, create random password for user and send via email
    const admin = req.admin;
    if (admin?.permissions.includes("user_create")) {
      password = generateRandomString(10);
    }

    const salt = await bcrypt.genSaltSync(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const secret = speakeasy.generateSecret();
    const token = speakeasy.totp({
      secret: secret.base32,
      encoding: "base32",
      time: 300,
    });

    const user = new User({
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      userName,
      country,
      city,
      agent,
      secret,
      temp_token: token,
    });
    const savedUser = await user.save();
    let emailBody;
    if (admin?.permissions.includes("user_create")) {
      emailBody = {
        subject: "Registration Confirm",
        content: `<p>Hello ${user.firstName} ${user.lastName}!</p><p>We are delighted to have you join us. Welcome to Auction3. Sell your property faster over the platform. Please click on the link to complete the registration process to confirm your account ${client_url}/confirm_email?token=${token}</p><p>A unique user ${user._id} will be generated, please do not share the ID with other users.</p><p>This is temporary password: <strong>${password}</strong> </p><p>Please use this password and your personal email to log in and change your password.</p><p>Thanks,</p><p>The Auction3™ Team</p>`,
      };
    } else {
      emailBody = await replaceEmailTemplate("registration_confirm", {
        name: `${savedUser.firstName} ${savedUser.lastName}`,
        customer_id: savedUser._id,
        link: `${client_url}/confirm_email?token=${token}`,
      });
      if (emailBody.error) {
        return res.status(200).send({ error: emailBody.error });
      }
    }

    sendEmail({
      to: user.email,
      subject: emailBody.subject,
      htmlText: emailBody.content,
    });
    res.status(200).send({
      userId: savedUser._id,
      message: "Confirm link sent successfully",
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//@desc get all users
//@route GET /api/users?page=..,limit=..,name=..(by firstName, lastName,email),
// should allow only super admin has permission user_read
const getAllUsers = async (req, res) => {
  try {
    let { page, limit, name, sort } = req.query;
    const paramsSchema = Joi.object({
      page: Joi.string().regex(/^\d+$/).optional(),
      limit: Joi.string().regex(/^\d+$/).optional(),
      name: Joi.string().optional(),
      sort: Joi.string().optional().valid("+firstName", "-firstName"),
    });
    const { error } = paramsSchema.validate(req.query);
    if (error) return res.status(200).send({ error: error.details[0].message });

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;

    let filters = {};
    let sorts = {};

    if (name) {
      filters["$or"] = [
        { firstName: { $regex: name } },
        { lastName: { $regex: name } },
        { email: { $regex: name } },
      ];
    }

    if (sort) {
      sorts[sort.slice(1)] = sort.slice(0, 1) === "-" ? -1 : 1;
    }

    let users = await User.find(filters, [
      "firstName",
      "lastName",
      "email",
      "phone",
      "userName",
      "country",
      "city",
      "agent",
      "isSuspended",
      "profileImage",
      "description",
    ])
      .lean()
      .sort(sorts);

    const userCount = users.length;
    users = users.slice((page - 1) * limit, (page - 1) * limit + limit);

    res.header({
      "Pagination-Count": userCount,
      "Pagination-Total-Pages": Math.ceil(userCount / limit),
      "Pagination-Page": page,
      "Pagination-Limit": limit,
    });
    res.status(200).send(users);
  } catch (e) {
    res.status(500).send(e.message);
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

    const emailBody = replaceEmailTemplate("registration_confirm", {
      name: `${user.firstName} ${user.lastName}`,
      customer_id: user._id,
    });

    if (emailBody.error) {
      return res.status(200).send({ error: emailBody.error });
    }

    sendEmail({
      to: user.email,
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
      to: user.email,
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

    if (user.isSuspended) {
      return res.status(200).send({ error: "Account has been suspended" });
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
        token,
        notifications: user.notifications,
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
        to: email,
        subject: "Auction3- Reset password",
        text: `Please click here to reset password: ${client_url}/reset_password?token=${token}`,
      });
      return res.status(200).send({ message: "Reset link sent successfully" });
    }
    if (token && password) {
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
      const emailBody = await replaceEmailTemplate("reset_password", {
        name: `${user.firstName} ${user.lastName}`,
        customer_id: user._id,
        link: `${client_url}/confirm_email?token=${token}`,
      });
      if (emailBody.error) {
        return res.status(200).send({ error: emailBody.error });
      }
      res.status(200).send({ message: "Your password is changed" });
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//should check if this user has been suspended, cannot edit
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
        description,
      } = req.body;

      let isOwner = req.user?.id.toString() === req.params.id;
      let isAbleToEditUser = req.admin?.permissions.includes("user_edit");

      if (!isAbleToEditUser && !isOwner) {
        return res.status(200).send({ error: "Not allowed to edit user" });
      }

      let user = await User.findById(req.params.id);
      if (!user) {
        return res.status(200).send({ error: "User not found" });
      }

      // check if email/ userName already exists
      if (email) {
        const emailExists = await User.findOne({ email: email.toLowerCase() });
        if (emailExists && emailExists._id.toString() !== user._id.toString()) {
          return res.status(200).send({ error: "Email already exists" });
        }
      }
      if (userName) {
        const userNameExists = await User.findOne({
          userName: userName.toLowerCase(),
        });
        if (
          userNameExists &&
          userNameExists._id.toString() !== user._id.toString()
        ) {
          return res.status(200).send({ error: "UserName already exists" });
        }
      }
      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      user.email = email || user.email;
      user.phone = phone || user.phone;
      user.userName = userName || user.userName;
      user.country = country || user.country;
      user.city = city || user.city;
      user.profileImage = profileImage;
      user.social_links = social_links || user.social_links;
      user.description = description || user.description;

      // if change password, only owner can change password
      if (old_password) {
        if (isAbleToEditUser) {
          return res
            .status(200)
            .send({ error: "Admin cannot change password of user" });
        }
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
        description: savedUser.description,
      };
      return res.status(200).send(result);
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
};
//deactivate user account and other related data, //should require reason for suspension and send email to notify
//@route PUT /api/users/:id?suspended=true
//@route PUT /api/users/:id?suspended=false
const suspendUserAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { suspended } = req.body;
    const bodySchema = Joi.object({
      suspended: Joi.string().required()
    });
    const { error } = bodySchema.validate(req.body);
    if (error) return res.status(200).send({ error: error.details[0].message });
    const user = await User.findById(id);
    if (!user) return res.status(200).send({ error: "User not found" });
    if (suspended === "true") {
      user.isSuspended = true;
      await user.save();
      const propertyDetails = await Property.find({
        createdBy: user._id.toString(),
      });
      propertyDetails.forEach(async (elements) => {
        await Auction.findOneAndUpdate(
          { property: elements._id.toString() },
          { isActive: false }
        );
      });
      sendEmail({
        to: user.email,
        subject: "Account activation",
        text: `sorry to suspend your account, please contact our admin for details`,
      });
      return res.status(200).send({ message: "User is now suspended" });
    }
    if (suspended === "false") {
      user.isSuspended = false;
      await user.save();
      sendEmail({
        to: user.email,
        subject: "Account activation",
        text: `Your account is activated`,
      });
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
    if (req.user?.id === req.params.id || req.admin?.includes("user_delete")) {
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
      // should check this, how about other buyers register to buy deleted auctions, their documents

      // delete buyers initiated by this user
      await Buyer.deleteMany({ userId });

      return res
        .status(200)
        .send({ message: "User account successfully deleted" });
    }
    res.status(200).send({ error: "Not allowed to delete user account" });
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
      (req.admin?.id && req.admin?.permissions.includes("buyer_read")) ||
      (req.user?.id && req.user.id === id)
    ) {
      let bidAuctions = await Auction.find({ "bids.userId": id })
        .populate("property", "type details images")
        .select(" -winner");
      bidAuctions = bidAuctions.map((auction) => {
        let [highestBid] = auction.bids.slice(-1);
        let bids = auction.bids.filter(
          (bid) => bid.buyerId.toString() === id.toString()
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

//should authorized only admin can view
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
                funds: "$funds",
                availableFund: "$availableFund",
                answers: "$answers",
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
          "firstName lastName userName phone email city country"
        );

        item = { ...item, ...user.toObject() };
        const auctions = await Promise.all(
          item.auctions.map(async (item) => {
            const auction = await Auction.findById(item._id).select(
              "_id registerStartDate registerEndDate auctionStartDate auctionEndDate bids"
            );
            auction.bids = auction.bids
              .filter(
                (bid) => bid.buyerId.toString() === item.buyerId.toString()
              )
              .map((bid) => {
                bid = bid.toObject();
                delete bid.buyerId;
                return bid;
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

//should authorized only admin can view
//@desc  Get properties of all sellers (grouped by user)
//@route GET /api/users/seller/properties
const getPropertiesOfAllSellersGroupByUser = async (req, res) => {
  try {
    if (!req.admin?.permissions.includes("user_read")) {
      return res.status(200).send({ error: "Not allowed to Access" });
    }

    const aggregate = await Property.aggregate([
      { $match: { step: 5 } },
      {
        $group: {
          _id: "$createdBy",
          properties: {
            $push: {
              _id: "$_id",
              type: "$type",
              details: "$details",
              images: "$images",
              videos: "$videos",
              documents: "$documents",
              isApproved: "$isApproved",
              discussedAmount: "$discussedAmount",
              reservedAmount: "$reservedAmount",
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user" } },
      {
        $project: {
          _id: "$_id",
          properties: "$properties",
          firstName: "$user.firstName",
          lastName: "$user.lastName",
          email: "$user.email",
          phone: "$user.phone",
          city: "$user.city",
          country: "$user.country",
        },
      },
    ]);
    return res.status(200).send(aggregate);
  } catch (err) {
    return res.status(500).send(err.message);
  }
};

//@desc  Get auctions of a buyer
//@route GET /api/users/:id/buyer/auctions   //should check if admin also
const getAuctionsOfBuyer = async (req, res) => {
  try {
    //check if auth user is same with user id
    if (
      !(
        req.user?.id === req.params.id ||
        req.admin?.permissions.includes("buyer_read")
      )
    ) {
      return res
        .status(200)
        .send({ error: "Not authorized to access actions of this buyer" });
    }

    const auctions = await Buyer.aggregate([
      { $match: { userId: ObjectId(req.params.id) } },
      {
        $lookup: {
          from: "auctions",
          localField: "auctionId",
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
                      details: "$details",
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
      {
        $unwind: "$auction",
      },
      { $unwind: { path: "$answers" } },
      {
        $lookup: {
          from: "questions",
          localField: "answers.questionId",
          foreignField: "_id",
          as: "question",
          pipeline: [
            {
              $project: {
                questionText: "$questionText",
              },
            },
          ],
        },
      },
      { $unwind: "$question" },
      {
        $project: {
          _id: "$_id",
          auction: "$auction",
          funds: "$funds",
          answer: {
            _id: "$answers._id",
            questionId: "$answers.questionId",
            answer: "$answers.answer",
            files: "$answers.files",
            explanation: "$answers.explanation",
            questionText: "$question.questionText",
          },
        },
      },
      {
        $group: {
          _id: "$_id",
          auction: { $first: "$auction" },
          funds: { $first: "$funds" },
          answers: { $addToSet: "$answer" },
        },
      },
      {
        $project: {
          _id: "$auction._id",
          startingBid: "$auction.startingBid",
          incrementAmount: "$auction.incrementAmount",
          registerStartDate: "$auction.registerStartDate",
          registerEndDate: "$auction.registerEndDate",
          auctionStartDate: "$auction.auctionStartDate",
          auctionEndDate: "$auction.auctionEndDate",
          // bids: "$auction.bids",
          property: "$auction.property",
          buyer: {
            _id: "$_id",
            answers: "$answers",

            funds: "$funds",
          },
        },
      },
    ]);

    for (let auction of auctions) {
      let isAbleToBid = false;
      for (let fund of auction.buyer.funds) {
        if (fund.document.isVerified === "success") {
          isAbleToBid = true;
          break;
        }
      }
      auction.isAbleToBid = isAbleToBid;
    }

    //should check if admin return all bidders, if just a user return only 5 highest bidders

    res.status(200).send(auctions);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

//@desc  Get funds of a buyer
//@route GET /api/users/:id/buyer/funds   //should check if admin also
const getFundsOfBuyer = async (req, res) => {
  try {
    //check if auth user is same with user id
    if (req.user.id !== req.params.id) {
      return res
        .status(200)
        .send({ error: "Not authorized to access actions of this buyer" });
    }
    const buyers = await Buyer.aggregate([
      { $match: { userId: ObjectId(req.user.id) } },
      {
        $lookup: {
          from: "auctions",
          localField: "auctionId",
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
                      property_address: "$details.property_address",
                    },
                  },
                ],
              },
            },
            { $unwind: "$property" },
          ],
        },
      },
      { $unwind: "$auction" },
      {
        $project: {
          _id: "$_id",
          auctionId: "$auction._id",
          property: "$auction.property",
          funds: "$funds",
          availableFund: "$availableFund",
          bids: "$auction.bids",
          // should filter from this, it should better
          // {
          //   $cond: {
          //     if: { $size: { $gt: [$size, 0] } },
          //     then: {
          //       $filter: {
          //         input: "$auction.bids",
          //         as: "bids",
          //         $eq: ["$$buyerId", "$_id"],
          //       },
          //     },
          //     else: [],
          //   },
          // },
        },
      },
    ]);

    for (let buyer of buyers) {
      buyer.bids =
        buyer.bids.length > 0
          ? buyer.bids
            .filter(
              (item) => item.buyerId.toString() === buyer._id.toString()
            )
            .map((item) => {
              delete item.buyerId;
              return item;
            })
          : [];
      delete buyer.funds;
    }

    //should check if admin return all bidders, if just a user return only 5 highest bidders

    res.status(200).send(buyers);
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

    let isOwner = req.user.id.toString() === req.params.id;
    let isAbleToAccessAdmin = req.admin?.permissions.includes("user_read");

    if (!isOwner || !isAbleToAccessAdmin) {
      return res.status(200).send({ error: "Not allowed to Access" });
    }

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
            await getBidsInformation(result.bids, result.startingBid);
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

//@desc  Delete a notification
//@route DELETE /api/users/:userId/notifications/:notificationId
const deleteNotification = async (req, res) => {
  try {
    const { userId, notificationId } = req.params;
    if (req.user.id.toString() === userId) {
      const user = await User.findById(userId);
      user.notifications.id(notificationId).remove();
      await user.save();
      res.status(200).send({ message: "Notification deleted successfully" });
    } else {
      return res
        .status(200)
        .send({ error: "Not authorized to delete notification" });
    }
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
  getFundsOfBuyer,
  getWinAuctionsOfBuyer,
  getAuctionsOfSeller,
  getListingsOfSeller,
  editProfile,
  getAuctionsOfAllBuyersGroupedByUser,
  getPropertiesOfAllSellersGroupByUser,
  deleteNotification,
  getAllUsers,
};
