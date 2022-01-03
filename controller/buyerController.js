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
      return res.status(404).send("Auction not found");
    }

    const isRegisteredAuction = await Buyer.findOne({
      auctionId,
      userId: user._id,
    });
    if (isRegisteredAuction) {
      return res
        .status(404)
        .send("This user is already registered to buy this property");
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
      return res
        .status(404)
        .send(
          `Missing answers ${numOfMissingQuestion} confidential ${
            numOfMissingQuestion === 1 ? "question" : "questions"
          }`
        );
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

module.exports = { createBuyer };
