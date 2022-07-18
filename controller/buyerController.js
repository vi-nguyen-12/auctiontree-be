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
    const { auctionId, docusignId, TC, answers, funds } = req.body;
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

    const isInRegisteredTime =
      new Date().getTime() > auction.registerStartDate.getTime() &&
      new Date().getTime() < auction.registerEndDate.getTime();

    if (!isInRegisteredTime) {
      return res
        .status(200)
        .send({ error: "This auction is out of buying registration period" });
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
    const result = {
      _id: savedBuyer._id,
      funds: savedBuyer.funds,
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
      to: user.email,
      subject: "Auction3- Register to bid",
      text: `Thank you for registering to bid for a ${property.type}. Your bidder ID is ${savedBuyer._id}. Your registration will be reviewed`,
    });
    res.status(200).send(result);
  } catch (err) {
    res.status(500).send(err);
  }
};

//Should fix this
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
      to: buyer.userId.email,
      subject: "Auction3- Request to change funding",
      text: `Your request for changing funding has been sent to the admin`,
    });

    res.status(200).send(result);
  } catch (err) {
    res.status(500).send(err.message);
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
      req.user?.id.toString() !== buyer.userId._id.toString() ||
      !req.admin?.roles.includes("buyer_edit")
    ) {
      return res
        .status(200)
        .send({ error: "Not allowed to add fund for this buyer" });
    }

    buyer.funds.push({ documents });
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

    res.status(200).send(result);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//@desc  Approve a fund,
//@route PUT /api/buyers/:id/funds/:id body: {amount}
const approveFund = async (req, res) => {
  try {
    if (!req.admin?.roles.includes("buyer_edit")) {
      return res
        .status(200)
        .send({ error: "Not allowed to approve fund for this buyer" });
    }
    const { buyerId, fundId } = req.params;
    const { amount } = req.body;

    const bodySchema = Joi.object({
      amount: Joi.number().required().min(0),
    });
    const { error } = bodySchema.validate(req.body);
    if (error) return res.status(200).send({ error: error.details[0].message });

    const buyer = await Buyer.findById(buyerId).populate("userId");
    if (!buyer) {
      return res.status(200).send({ error: "Buyer not found" });
    }
    //check if buyer is approved
    if (buyer.isApproved !== "success") {
      return res.status(200).send({ error: "Buyer is not approved" });
    }

    const fund = buyer.funds.id(fundId);
    //check if all documents are verified
    for (document of fund.documents) {
      if (document.isVerified !== "success") {
        return res
          .status(200)
          .send({ error: "Not all documents are verified" });
      }
    }
    fund.amount = amount;

    await fund.save({ suppressWarning: true });
    const savedBuyer = await buyer.save();
    const result = {
      _id: savedBuyer._id,
      fund,
    };
    sendEmail({
      to: buyer.userId.email,
      subject: "Auction3- Request to change funding",
      text: `Your request to add more funding has been sent to the admin`,
    });

    res.status(200).send(result);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//@desc  Approve a buyer
//@route PUT /api/buyers/:id/status body: {status:"pending"/"success"/"fail", rejectedReason:...}
const approveBuyer = async (req, res) => {
  try {
    if (req.admin?.roles.includes("buyer_approval")) {
      const bodySchema = Joi.object({
        status: Joi.string().valid("pending", "success", "fail"),
        // approvedFund: Joi.number().strict(),
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
        let isAFundApproved = false;
        for (let fund of buyer.funds) {
          let isFundApproved = true;
          for (document of fund.documents) {
            if (document.isVerified !== "success") {
              isFundApproved = false;
              break;
            }
          }
          if (isFundApproved) {
            isAFundApproved = true;
            break;
          }
        }
        if (!isAFundApproved) {
          return res.status(200).send({
            error: "Not all documents for a specific fund is approved",
          });
        }

        for (let item of buyer.answers) {
          if (item.isApproved === false) {
            const question = await Question.findById(item.questionId);
            return res.status(200).send({
              error: `Answer of question "${question.questionText}" is not approved`,
            });
          }
        }
        // let previousFund = buyer.approvedFund || 0;
        // buyer.approvedFund = approvedFund;
        // const user = await User.findOne({ _id: buyer.userId });
        // user.wallet = user.wallet + -previousFund + approvedFund;
        // await user.save();
        sendEmail({
          to: buyer.userId.email,
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
          to: buyer.userId.email,
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
        // approvedFund: savedBuyer.approvedFund,
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

      // update document status
      let updatedDocument, fund;
      buyer.funds = buyer.funds.map((fund) => {
        for (document of fund.documents) {
          if (document._id.toString() === documentId) {
            document.isVerified = status;
            updatedDocument = document;
            if (status !== "success") {
              fund.amount = 0;
            }
            break;
          }
        }
        return fund;
      });

      if (!updatedDocument) {
        return res.status(200).send({ error: "No document found" });
      }

      //update status of buyer
      if (status !== "success") {
        let isAFundApproved = false;
        for (let fund of buyer.funds) {
          let isFundApproved = true;
          for (document of fund.documents) {
            if (document.isVerified !== "success") {
              isFundApproved = false;
              break;
            }
          }
          if (isFundApproved) {
            isAFundApproved = true;
            break;
          }
        }
        if (!isAFundApproved) {
          buyer.isApproved = "pending";
        }
      }

      const savedBuyer = await buyer.save();
      const data = {
        _id: updatedDocument._id,
        name: updatedDocument.name,
        url: updatedDocument.url,
        isVerified: updatedDocument.isVerified,
        buyerId: savedBuyer._id,
        auctionId: savedBuyer.auctionId,
        isApproved: savedBuyer.isApproved,
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
  approveFund,
  addFund,
  editBuyer,
  approveBuyer,
  verifyDocument,
  getBuyers,
  approveAnswer,
  deleteBuyer,
};
