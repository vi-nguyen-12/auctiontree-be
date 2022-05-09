const Joi = require("joi");
const Buyer = require("../model/Buyer");
const User = require("../model/User");
const Question = require("../model/Question");
const Property = require("../model/Property");
const Auction = require("../model/Auction");
const Docusign = require("../model/Docusign");
const { sendEmail } = require("../helper");

//@desc  Create a buyer
//@route POST /api/buyers body:{auctionId, docusignId,TC, answers:[{questionId, answer: "yes"/"no", explanation:"", documents:[{officialName:..., name:...,url:...}]}] } TC:{time: ISOString format, IPAddress:...}
const createBuyer = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user.id });
    const { auctionId, documents, docusignId, TC, answers } = req.body;
    const auction = await Auction.findOne({ _id: auctionId }).populate(
      "property"
    );

    const docusign = await Docusign.findOne({ _id: docusignId });

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

    const newBuyer = new Buyer({
      userId: user._id,
      auctionId,
      documents,
      docusignId,
      TC,
      answers,
    });

    const savedBuyer = await newBuyer.save();
    const property = await Property.findOne({ _id: auction.property });
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
      subject: "Auction3- Register to bid",
      text: `Thank you for registering to bid for a ${property.type}. Your bidder ID is ${savedBuyer._id}. Your registration will be reviewed`,
    });
    res.status(200).send(result);
  } catch (err) {
    res.status(500).send(err);
  }
};

//@desc  Request more funding
//@route PUT /api/buyers/:id body:{documents:[{_id:...}{officialName:..., name:...,url:...}]}}
const editBuyer = async (req, res) => {
  try {
    let { documents } = req.body;
    const buyer = await Buyer.findById(req.params.id).populate("userId");
    if (!buyer) {
      return res.status(200).send({ error: "Buyer not found" });
    }
    if (
      req.user?.id.toString() !== buyer.userId.toString() ||
      req.admin?.roles.includes("buyer_edit")
    ) {
      return res.status(200).send({ error: "Not allowed to edit this buyer" });
    }

    documents = documents.map((item) => {
      if (item._id) {
        for (let doc of buyer.documents) {
          if (doc._id.toString() === item._id) {
            return doc;
          }
        }
      }
      return { ...item, isVerified: "pending" };
    });
    buyer.documents = documents;

    buyer.isApproved = "pending";
    const savedBuyer = await buyer.save();
    const result = {
      _id: savedBuyer._id,
      documents: savedBuyer.documents,
    };
    sendEmail({
      email: buyer.userId.email,
      subject: "Auction3- Request to change funding",
      text: `Your request for changing funding has been sent to the admin`,
    });

    res.status(200).send(result);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//@desc  Approve a buyer
//@route PUT /api/buyers/:id/status body: {status:"pending"/"success"/"fail", approvedFund:..., rejectedReason:...}
const approveBuyer = async (req, res) => {
  try {
    if (req.admin?.roles.includes("buyer_approval")) {
      const bodySchema = Joi.object({
        status: Joi.string().valid("pending", "success", "fail"),
        approvedFund: Joi.number().strict(),
        rejectedReason: Joi.string().optional(),
      });
      const { error } = bodySchema.validate(req.body);
      if (error)
        return res.status(200).send({ error: error.details[0].message });

      const { status, approvedFund, rejectedReason } = req.body;
      const buyer = await Buyer.findOne({ _id: req.params.id }).populate(
        "userId"
      );
      if (!buyer) {
        return res.status(200).send({ error: "Buyer not found" });
      }
      if (status === "success") {
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
        let previousFund = buyer.approvedFund || 0;
        buyer.approvedFund = approvedFund;
        const user = await User.findOne({ _id: buyer.userId });
        user.wallet = user.wallet - previousFund + approvedFund;
        await user.save();
        sendEmail({
          email: buyer.userId.email,
          subject: "Auction3- Buyer Application Approved",
          text: `Congratulation, your application application is approved with $${approvedFund} in your wallet. This amount is available for your bidding.`,
        });
      }
      if (status === "fail") {
        if (!rejectedReason) {
          return res
            .status(200)
            .send({ error: "Please specify reason for reject" });
        }
        sendEmail({
          email: buyer.userId.email,
          subject: "Auction3- Buyer Application Rejected",
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
        approvedFund: savedBuyer.approvedFund,
        rejectedReason: savedBuyer.rejectedReason,
      };
      return res.status(200).send(result);
    }
    return res.status(200).send({ error: "Not allowed to edit this buyer" });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

//@desc  Verify a document
//@route PUT /api/buyers/:buyerId/documents/:documentId/status body={status:"pending"/"success"/"fail"}

const verifyDocument = async (req, res) => {
  try {
    if (req.admin?.roles.includes("buyer_document_approval")) {
      const bodySchema = Joi.object({
        status: Joi.string().valid("pending", "success", "fail"),
      });
      const { error } = bodySchema.validate(req.body);
      if (error) {
        return res.status(200).send({ error: error.details[0].message });
      }

      const { status } = req.body;
      const { buyerId, documentId } = req.params;
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
      return res.status(200).send(data);
    }
    return res.status(200).send({ error: "Not allowed to verify document" });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//@desc  Approve an answer
//@route PUT /api/buyers/:buyerId/answers/:questionId/approved
const approveAnswer = async (req, res) => {
  try {
    if (req.admin?.roles.includes("buyer_answer_approval")) {
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
      return res.status(200).send(result);
    }
    res.status(200).send({ error: "Not allowed to approve answer" });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//@desc  Get all buyers & filter by status
//@route GET /api/buyers?status=...
const getBuyers = async (req, res) => {
  try {
    console.log(req.admin);
    if (req.admin?.roles.includes("buyer_read")) {
      const { status } = req.query;
      let query = {};
      if (status) {
        query.isApproved = status;
      }
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
    if (req.admin?.roles.includes("buyer_delete")) {
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
  editBuyer,
  approveBuyer,
  verifyDocument,
  getBuyers,
  approveAnswer,
  deleteBuyer,
};
