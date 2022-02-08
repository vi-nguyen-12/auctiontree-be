const Buyer = require("../model/Buyer");
const User = require("../model/User");
const Question = require("../model/Question");
const Property = require("../model/Property");
const Auction = require("../model/Auction");
const { sendEmail } = require("../helper");

//@desc  Create a buyer
//@route POST /api/buyers body:{auctionId, documents, docusign,TC, answers:[{questionId, answer: "yes"/"no", explanation:"", files:[{name:...url:...}]}] } TC:ISOString format
const createBuyer = async (req, res) => {
  const user = await User.findOne({ _id: req.user.userId });

  const { auctionId, documents, docusign, TC, answers } = req.body;
  const requiredDocuments = [
    "bank_statement",
    "brokerage_account_statement",
    "crypto_account_statement",
    "line_of_credit_doc",
  ];
  // const timeOfTC = new Date(TC);
  try {
    const auction = await Auction.findOne({ _id: auctionId });
    if (!auction) {
      return res.status(200).send({ error: "Auction not found" });
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
    for (let item of requiredDocuments) {
      if (!documents.find((i) => i.officialName === item)) {
        return res.status(200).send({ error: `Document ${item} is required` });
      }
    }
    let checkQuestion = true;
    await Promise.all(
      answers.map(async (item) => {
        let result = await Question.findOne({ _id: item.questionId });
        if (!result) checkQuestion = false;
      })
    );

    if (!checkQuestion) {
      return res.status(404).send("Question not found");
    }
    let questionsTotal = await Question.count();
    if (answers.length < questionsTotal) {
      let numOfMissingQuestion = questionsTotal - answers.length;
      return res.status(200).send({
        error: `Missing answers ${numOfMissingQuestion} confidential ${
          numOfMissingQuestion === 1 ? "question" : "questions"
        }`,
      });
    }

    const newBuyer = new Buyer({
      userId: user._id,
      auctionId,
      documents,
      docusign,
      TC,
      answers,
    });

    const savedBuyer = await newBuyer.save();

    const property = await Property.findOne({ _id: auction.propertyId });

    const result = {
      _id: savedBuyer._id,
      documents: savedBuyer.documents,
      docusign: savedBuyer.docusign,
      TC: savedBuyer.TC,
      isApproved: savedBuyer.isApproved,
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
    };
    sendEmail({
      email: user.email,
      subject: "Auction 10X- Register to bid",
      text: `Thank you for registering to bid for a ${property.type}. Your bidder ID is ${savedBuyer._id}. Your registration will be reviewed`,
    });

    res.status(200).send(result);
  } catch (err) {
    res.status(500).send(err);
  }
};

//@desc  Approve a buyer
//@route PUT /api/buyers/:id/status body: {status:"pending"/"success"/"fail", walletAmount:...,rejectedReason:...}
const approveBuyer = async (req, res) => {
  try {
    const bodySchema = Joi.object({
      status: Joi.string().valid("pending", "success", "fail"),
      walletAmount: Joi.string().regex(/^\d+$/).optional(),
      rejectedReason: Joi.string().optional(),
    });
    const { error } = bodySchema.validate(req.body);
    if (error) return res.status(200).send({ error: error.details[0].message });

    const { status, walletAmount, rejectedReason } = req.body;
    const buyer = await Buyer.findOne({ _id: req.params.id }).populate(
      "userId"
    );
    if (!buyer) {
      return res.status(200).send({ error: "Buyer not found" });
    }
    if (status === "success") {
      if (!walletAmount)
        return res
          .status(200)
          .send({ error: "Please specify the amount for wallet" });
      if (!buyer.docusign.isSigned) {
        return res
          .status(200)
          .send({ error: "Approved failed. Docusign is not signed" });
      }
      for (let document of buyer.documents) {
        if (document.isVerified !== "success") {
          return res.status(200).send({
            error: `Approved failed. Document ${document.name} is not verified`,
          });
        }
      }
      for (let item of buyer.answers) {
        if (item.isApproved === false) {
          const question = await Question.findById(item.questionId);
          return res.status(200).send({
            error: `Answer of question "${question.questionText}" is not approved`,
          });
        }
      }
      sendEmail({
        email: buyer.userId.email,
        subject: "Auction10X- Buyer Application Approved",
        text: `Congratulation, your application application is approved with $${walletAmount} in your wallet. This amount is available for your bidding.`,
      });
      buyer.walletAmount = walletAmount;
    }
    if (status === "fail") {
      if (!rejectedReason) {
        return res
          .status(200)
          .send({ error: "Please specify reason for reject" });
      }
      sendEmail({
        email: buyer.userId.email,
        subject: "Auction10X- Buyer Application Rejected",
        text: `Your application application is rejected. The reason is $${rejectedReason}`,
      });
      buyer.rejectedReason = rejectedReason;
    }
    buyer.isApproved = status;
    const savedBuyer = await buyer.save();
    const result = {
      _id: savedBuyer._id,
      userId: {
        _id: savedBuyer.userId._id,
        firstName: savedBuyer.userId.firstName,
        lastName: savedBuyer.userId.lastName,
        userName: savedBuyer.userId.userName,
      },
      auctionId: savedBuyer.auctionId,
      documents: savedBuyer.documents,
      isApproved: savedBuyer.isApproved,
      walletAmount: savedBuyer.walletAmount,
      rejectedReason: savedBuyer.rejectedReason,
    };
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

//@desc  Verify a document
//@route PUT /api/buyers/:buyerId/documents/:documentId/status body={status:"pending"/"success"/"fail"}

const verifyDocument = async (req, res) => {
  const bodySchema = Joi.object({
    status: Joi.string().valid("pending", "success", "fail"),
  });
  const { error } = bodySchema.validate(req.body);
  if (error) {
    return res.status(200).send({ error: error.details[0].message });
  }

  const { status } = req.body;
  const { buyerId, documentId } = req.params;
  try {
    const buyer = await Buyer.findById(buyerId);
    if (!buyer) {
      return res.status(200).send({ error: "Buyer not found" });
    }
    const document = buyer.documents.id(documentId);
    if (!document) {
      return res.status(200).send({ error: "Document not found" });
    }
    document.isVerified = status;
    const savedDocument = await document.save();
    const savedBuyer = await buyer.save();
    const data = {
      _id: savedDocument._id,
      name: savedDocument.name,
      url: savedDocument.url,
      isVerified: savedDocument.isVerified,
      buyerId: savedBuyer._id,
      auctionId: savedBuyer.auctionId,
    };
    res.status(200).send(data);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//@desc  Approve an answer
//@route PUT /api/buyers/:buyerId/answers/:questionId/approved
const approveAnswer = async (req, res) => {
  try {
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
      isApproved: savedBuyer.isApproved,
    };
    res.status(200).send(result);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//@desc  Get all buyers & filter by status
//@route GET /api/buyers
const getBuyers = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status) {
      query.isApproved = status;
    }
    const buyers = await Buyer.find(query);
    res.status(200).send(buyers);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

module.exports = {
  createBuyer,
  approveBuyer,
  verifyDocument,
  getBuyers,
  approveAnswer,
};
