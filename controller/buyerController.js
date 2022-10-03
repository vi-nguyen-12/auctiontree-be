const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);
const Buyer = require("../model/Buyer");
const User = require("../model/User");
const Question = require("../model/Question");
const Property = require("../model/Property");
const Auction = require("../model/Auction");
const Docusign = require("../model/Docusign");
const { sendEmail, replaceEmailTemplate } = require("../helper");

//@desc  Create a buyer
//@route POST /api/buyers body:{auctionId, docusignId,TC, answers:[{questionId, answer: "yes"/"no", explanation:"", documents:[{officialName:..., name:...,url:...}]}] } TC:{time: ISOString format, IPAddress:...}
const createBuyer = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user.id });
    const { auctionId, docusignId, TC, answers, documents } = req.body;
    const auction = await Auction.findOne({ _id: auctionId }).populate(
      "property"
    );
    const docusign = await Docusign.findOne({ _id: docusignId });
    let funds = [];

    if (!auction) {
      return res.status(200).send({ error: "Auction not found" });
    }
    if (!docusign) {
      return res.status(200).send({ error: "Docusign not found" });
    }

    if (user._id.toString() === auction.property.createdBy.toString()) {
      return res.status(200).send({ error: "Cannot bid on your own property" });
    }

    const isRegisteredAuction = await Buyer.findOne({
      auctionId,
      userId: user._id,
    });

    if (isRegisteredAuction) {
      return res.status(200).send({
        error: "This user is already registered to buy this property",
      });
    }

    const questions = await Question.find({});
    for (let item of questions) {
      if (answers.find((i) => i.questionId === item._id.toString()) === null) {
        return res.status(200).send({
          error: `Answer of question "${item.questionText}" is required`,
        });
      }
    }

    const isInRegisteredTime =
      new Date().getTime() > auction.registerStartDate.getTime() &&
      new Date().getTime() < auction.registerEndDate.getTime();

    if (!isInRegisteredTime) {
      return res
        .status(200)
        .send({ error: "This auction is out of buying registration period" });
    }

    for (document of documents) {
      funds.push({ document });
    }

    const newBuyer = new Buyer({
      userId: user._id,
      auctionId,
      docusignId,
      funds,
      TC,
      answers,
    });

    const savedBuyer = await newBuyer.save();
    const property = await Property.findOne({ _id: auction.property });

    //send email
    let emailBody;
    emailBody = await replaceEmailTemplate("register_to_bid", {
      name: `${user.firstName} ${user.lastName}`,
      auction_id: savedBuyer.auctionId,
      property_type: property.type,
      property_address: `${property.details.property_address.formatted_street_address} ${property.details.property_address.zip_code} ${property.details.property_address.city} ${property.details.property_address.state} ${property.details.property_address.country}`,
    });
    if (emailBody.error) {
      return res.status(200).send({ error: emailBody.error });
    }

    sendEmail({
      to: user.email,
      subject: emailBody.subject,
      htmlText: emailBody.content,
    });

    const result = {
      _id: savedBuyer._id,
      funds: savedBuyer.funds,
      docusign: savedBuyer.docusign,
      TC: savedBuyer.TC,
      auctionId: savedBuyer.auctionId,
      property: {
        _id: property._id,
        type: property.type,
        details: property.details,
        images: property.images,
        videos: property.videos,
        documents: property.documents,
      },
      answers,
      availableFund: savedBuyer.availableFund,
    };
    res.status(200).send(result);
  } catch (err) {
    res.status(500).send(err);
  }
};

//@desc  Edit buyer, can only change answers or funds
//@route PUT /api/buyers/:id body:{documents:[{_id:...}{officialName:..., name:...,url:...}]}}
const editBuyer = async (req, res) => {
  try {
    let { documents, answers } = req.body;
    const bodySchema = Joi.object({
      answers: Joi.array()
        .items(
          Joi.object({
            questionId: Joi.objectId().required(),
            answer: Joi.string().valid("yes", "no").required(),
            explanation: Joi.when("answer", {
              is: Joi.string().valid("yes"),
              then: Joi.string().required(),
              otherwise: Joi.string().allow(null, ""),
            }),
            files: Joi.when("answer", {
              is: Joi.string().valid("yes"),
              then: Joi.array()
                .required()
                .items(
                  Joi.object({
                    name: Joi.string().required(),
                    url: Joi.string().required(),
                  })
                ),
              otherwise: Joi.string().allow(null, ""),
            }),
          })
        )
        .optional(),
      documents: Joi.array()
        .items({
          officialName: Joi.string()
            .valid(
              "bank_statement",
              "brokerage_account_statement",
              "crypto_account_statement",
              "line_of_credit_doc"
            )
            .required(),
          url: Joi.string().required(),
          name: Joi.string().required(),
          validity: Joi.date().iso().optional(),
          isSelf: Joi.boolean().required(),
          funderName: Joi.when("isSelf", {
            is: Joi.boolean().valid(false),
            then: Joi.string().required(),
            otherwise: Joi.forbidden(),
          }),
          providerName: Joi.when("isSelf", {
            is: Joi.boolean().valid(false),
            then: Joi.string().required(),
            otherwise: Joi.forbidden(),
          }),
          declaration: Joi.when("isSelf", {
            is: Joi.boolean().valid(false),
            then: Joi.object({
              time: Joi.date().iso().required(),
              IPAddress: Joi.string().required(),
            }),
            otherwise: Joi.forbidden(),
          }),
          _id: Joi.string().optional(),
        })
        .optional(),
    });

    const { error } = bodySchema.validate(req.body);
    if (error) return res.status(200).send({ error: error.details[0].message });
    let buyer = await Buyer.findById(req.params.id).populate("userId");
    if (!buyer) {
      return res.status(200).send({ error: "Buyer not found" });
    }
    if (
      !(
        req.user?.id.toString() === buyer.userId._id.toString() ||
        req.admin?.permissions.includes("buyer_edit")
      )
    ) {
      return res.status(200).send({ error: "Not allowed to edit this buyer" });
    }

    if (answers) {
      //check if answer is changed
      for (let item of answers) {
        let previousAnswer = buyer.answers.filter(
          (i) => i.questionId.toString() === item.questionId.toString()
        )[0];

        if (item.answer === "yes") {
          //check if files upload for answer is changed
          let isFileChanged = false;

          for (let file of item.files) {
            if (
              previousAnswer.files.map((e) => e.url).indexOf(file.url) === -1
            ) {
              isFileChanged = true;
            }
          }
          if (isFileChanged) {
            item = { ...item, isApproved: "pending" };
          } else {
            item = previousAnswer;
          }
        }
      }
      buyer.answers = answers;
      buyer = await buyer.save();
      //check if all answers are approved:
      let isAllAswersApproved = true;
      for (let i of buyer.answers) {
        if (!i.isApproved) {
          isAllAswersApproved = false;
          break;
        }
      }
      if (!isAllAswersApproved) {
        let fundsReset = buyer.funds.map((item) => {
          return {
            document: { ...item.document, isVerified: "pending" },
            amount: 0,
          };
        });
        buyer.funds = fundsReset;
      }
    }
    if (documents) {
      //check if document is changed
      let newFunds = [];
      for (let item of documents) {
        let previousFund = buyer.funds.filter(
          (i) => item.url === i.document.url
        );

        if (previousFund.length > 0) {
          newFunds.push(previousFund[0]);
        } else {
          newFunds.push({
            document: { ...item, isVerified: "pending" },
            amount: 0,
          });
        }
      }

      buyer.funds = newFunds;
    }

    const savedBuyer = await buyer.save();
    const result = {
      _id: savedBuyer._id,
      answers: savedBuyer.answers,
      funds: savedBuyer.funds,
    };
    sendEmail({
      to: buyer.userId.email,
      subject: "Auction3- Request to change funding",
      text: `Your request for changing funding has been sent to the admin`,
    });

    res.status(200).send(result);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

const getBuyer = async (req, res) => {
  try {
    const buyer = await Buyer.findById(req.params.id);
    return res.status(200).send(buyer);
  } catch (err) {
    return res.status(500).send(err.message);
  }
};

//@desc  Request more funding
//@route PUT /api/buyers/:id/funds/addition body:{documents:[{officialName:..., name:...,url:...}]}}
const addFund = async (req, res) => {
  try {
    let { documents } = req.body;
    const buyer = await Buyer.findById(req.params.id).populate("userId");
    if (!buyer) {
      return res.status(200).send({ error: "Buyer not found" });
    }

    if (
      req.user?.id.toString() === buyer.userId._id.toString() ||
      req.admin?.permissions.includes("buyer_edit")
    ) {
      for (document of documents) {
        buyer.funds.push({ document });
      }

      const savedBuyer = await buyer.save();
      const result = {
        _id: savedBuyer._id,
        funds: savedBuyer.funds,
      };
      sendEmail({
        to: buyer.userId.email,
        subject: "Auction3- Request to change funding",
        text: `Your request to add more funding has been sent to the admin`,
      });
      return res.status(200).send(result);
    } else {
      return res
        .status(200)
        .send({ error: "Not allowed to add fund for this buyer" });
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//@desc  Approve/disapprove a fund,
//@route PUT /api/buyers/:id/fund/:id body: {status:..., amount}
const approveFund = async (req, res) => {
  try {
    const bodySchema = Joi.object({
      status: Joi.string().required().valid("pending", "success", "fail"),
      amount: Joi.when("status", {
        is: Joi.string().valid("success"),
        then: Joi.number().required().min(0),
        otherwise: Joi.forbidden(),
      }),
    });
    const { error } = bodySchema.validate(req.body);
    if (error) return res.status(200).send({ error: error.details[0].message });
    if (!req.admin?.permissions.includes("buyer_edit")) {
      return res
        .status(200)
        .send({ error: "Not allowed to approve fund for this buyer" });
    }
    const { buyerId, fundId } = req.params;
    const { status, amount } = req.body;

    const buyer = await Buyer.findById(buyerId).populate("userId");
    const user = await User.findById(buyer.userId._id);
    if (!buyer) {
      return res.status(200).send({ error: "Buyer not found" });
    }

    const fund = buyer.funds.id(fundId);
    if (!fund) {
      return res.status(200).send({ error: "Document is not found" });
    }
    fund.document.isVerified = status;

    //check if all answers are approved
    if (status === "success") {
      for (let item of buyer.answers) {
        if (!item.isApproved) {
          const question = await Question.findById(item.questionId);
          return res.status(200).send({
            error: `Answer of question "${question.questionText}" is not approved`,
          });
        }
      }
      //check if that document is approved for a fund before
      buyer.availableFund = buyer.availableFund - fund.amount + amount;
      fund.amount = amount;
    } else {
      if (fund.amount !== 0) {
        buyer.availableFund = buyer.availableFund - fund.amount;
      }
      fund.amount = 0;
    }
    await fund.save({ suppressWarning: true });

    const savedBuyer = await buyer.save();
    const result = {
      _id: savedBuyer._id,
      fund,
    };

    //send email to buyer
    let emailBody;
    if (status == "success") {
      emailBody = await replaceEmailTemplate("POF_approval", {
        name: `${buyer.userId.firstName} ${buyer.userId.lastName}`,
        document_name: fund.document.name,
        amount,
      });
    } else {
      emailBody = await replaceEmailTemplate("POF_rejected", {
        name: `${buyer.userId.firstName} ${buyer.userId.lastName}`,
        document_name: fund.document.name,
      });
    }
    if (emailBody.error) {
      return res.status(200).send({ error: emailBody.error });
    }

    sendEmail({
      to: buyer.userId.email,
      subject: emailBody.subject,
      htmlText: emailBody.content,
    });

    //add notifications to user
    user.notifications.push({
      buyerId: buyer._id,
      message: "Proof of funds are approved",
    });
    await user.save();

    res.status(200).send(result);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//@desc  Approve an answer
//@route PUT /api/buyers/:buyerId/answers/:questionId/approved
const approveAnswer = async (req, res) => {
  try {
    if (req.admin?.permissions.includes("buyer_answer_approval")) {
      const { buyerId, questionId } = req.params;
      const buyer = await Buyer.findById(buyerId).populate("answers");
      if (!buyer) {
        return res.status(200).send({ error: "Buyer not found" });
      }

      const question = buyer.answers.find(
        (item) => item.questionId.toString() === questionId
      );
      if (!question) {
        return res.status(200).send({ error: "Question not found" });
      }

      question.isApproved = true;
      await question.save({ suppressWarning: true });
      const savedBuyer = await buyer.save();
      const result = {
        _id: savedBuyer._id,
        userId: savedBuyer.userId,
        auctionId: savedBuyer.auctionId,
        answers: savedBuyer.answers,
      };
      return res.status(200).send(result);
    }
    res.status(200).send({ error: "Not allowed to approve answer" });
  } catch (err) {
    res.status(500).send(err.message);
  }
};
//@desc  Disapprove an answer
//@route PUT /api/buyers/:buyerId/answers/:questionId/disapproved
const disapproveAnswer = async (req, res) => {
  try {
    if (req.admin?.permissions.includes("buyer_answer_approval")) {
      const { buyerId, questionId } = req.params;
      const buyer = await Buyer.findById(buyerId).populate("answers");
      if (!buyer) {
        return res.status(200).send({ error: "Buyer not found" });
      }

      const question = buyer.answers.find(
        (item) => item.questionId.toString() === questionId
      );
      if (!question) {
        return res.status(200).send({ error: "Question not found" });
      }

      question.isApproved = false;
      await question.save({ suppressWarning: true });
      const savedBuyer = await buyer.save();
      const result = {
        _id: savedBuyer._id,
        userId: savedBuyer.userId,
        auctionId: savedBuyer.auctionId,
        answers: savedBuyer.answers,
      };
      return res.status(200).send(result);
    }
    res.status(200).send({ error: "Not allowed to disapprove answer" });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//@desc  Get all buyers & filter by status
//@route GET /api/buyers?status=...
const getBuyers = async (req, res) => {
  try {
    if (req.admin?.permissions.includes("buyer_read")) {
      let query = {};
      const buyers = await Buyer.aggregate([
        { $match: query },
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
                  pipeline: [{ $project: { _id: "$_id", images: "$images" } }],
                },
              },
              { $unwind: { path: "$property" } },
              { $project: { _id: "$_id", property: "$property" } },
            ],
          },
        },
        { $unwind: { path: "$auction" } },
        {
          $addFields: {
            property: {
              _id: "$auction.property._id",
              images: "$auction.property.images",
            },
          },
        },
        { $unset: "auction" },
      ]);

      return res.status(200).send(buyers);
    }
    res.status(200).send({ error: "Not allowed to get buyers" });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//@desc  Delete a buyer
//@route DELETE /api/buyers/:id
const deleteBuyer = async (req, res) => {
  try {
    if (req.admin?.permissions.includes("buyer_delete")) {
      await Buyer.deleteOne({ _id: req.params.id });
      return res.status(200).send({ message: "Buyer deleted successfully" });
    }
    res.status(200).send({ error: "Not allowed to delete buyer" });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

module.exports = {
  createBuyer,
  approveFund,
  addFund,
  editBuyer,
  getBuyer,
  getBuyers,
  approveAnswer,
  disapproveAnswer,
  deleteBuyer,
};
