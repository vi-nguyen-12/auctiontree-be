const Buyer = require("../model/Buyer");
const User = require("../model/User");
const Question = require("../model/Question");
const Property = require("../model/Property");
const Auction = require("../model/Auction");
const { sendEmail } = require("../helper");

//@desc  Create a buyer
//@route POST /api/buyers body:{auctionId, documents, docusign,TC, answers:[{questionId, answer: "yes"/"no"}] } TC:ISOString format
const createBuyer = async (req, res) => {
  const user = await User.findOne({ _id: req.user.userId });

  const { auctionId, documents, docusign, TC, answers } = req.body;
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
//@route PUT /api/buyers/:id/approved body: {walletAmount:...}
const approveBuyer = async (req, res) => {
  const { walletAmount } = req.body;
  try {
    const buyer = await Buyer.findOne({ _id: req.params.id }).populate(
      "userId"
    );
    //need to check questions ??
    if (!buyer) {
      return res.status(200).send({ error: "Buyer not found" });
    }
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
    sendEmail({
      email: buyer.userId.email,
      subject: "Auction10X- Buyer Application Approved",
      text: `Congratulation, your application application is approved with $${walletAmount} in your wallet. This amount is available for your bidding.`,
    });
    buyer.isApproved = true;
    buyer.walletAmount = walletAmount;
    const savedBuyer = await buyer.save();
    res.status(200).send(savedBuyer);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

//@desc  Disapprove a buyer
//@route PUT /api/buyers/:id/disapproved body: {rejectedReason: ... }
const disapproveBuyer = async (req, res) => {
  const { rejectedReason } = req.body;
  try {
    const buyer = await Buyer.findOne({ _id: req.params.id }).populate(
      "userId"
    );
    if (!buyer) {
      return res.status(200).send({ error: "Buyer not found" });
    }
    sendEmail({
      email: buyer.userId.email,
      subject: "Auction10x: Reject buyer application",
      text: rejectedReason,
    });
    buyer.isApproved = false;
    buyer.rejectedReason = rejectedReason;
    const savedBuyer = await buyer.save();
    res.status(200).send(savedBuyer);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

//@desc  Verify a document
//@route PUT /api/buyers/:buyerId/documents/:documentId/status body={status:"pending"/"success"/"fail"}

const verifyDocument = async (req, res) => {
  const { status } = req.body;
  if (status !== "pending" && status !== "success" && status !== "fail") {
    return res.status(200).send({
      error: "Status value must be 'pending' or 'success' or 'fail'",
    });
  }
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

//@desc  Get all buyers
//@route GET /api/buyers
const getBuyers = async (req, res) => {
  try {
    const buyers = await Buyer.find({});
    res.status(200).send(buyers);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//@desc  Get not approved buyers
//@route GET /api/buyers/notApproved
const getNotApprovedBuyers = async (req, res) => {
  try {
    const buyers = await Buyer.find({ isApproved: false });
    res.status(200).send(buyers);
  } catch (err) {
    res.status(500).send(err.message);
  }
};
//@desc  Get approved buyers
//@route GET /api/buyers/approved
const getApprovedBuyers = async (req, res) => {
  try {
    const buyers = await Buyer.find({ isApproved: true });
    res.status(200).send(buyers);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

module.exports = {
  createBuyer,
  approveBuyer,
  disapproveBuyer,
  verifyDocument,
  getBuyers,
  getApprovedBuyers,
  getNotApprovedBuyers,
};
