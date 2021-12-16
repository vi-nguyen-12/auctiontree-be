const Buyer = require("../model/Buyer");
const User = require("../model/User");
const Property = require("../model/Property");
const { sendEmail } = require("../helper");

//@desc  Create a buyer
//@route POST /api/buyers body:{propertyId, documents, docusign,TC } TC:ISOString format
const createBuyer = async (req, res) => {
  const user = await User.findOne({ _id: req.user.userId });
  const { propertyId, documents, docusign, TC } = req.body;
  const timeOfTC = new Date(TC);
  try {
    const property = await Property.findOne({ _id: propertyId });
    if (!property) {
      return res.status(404).send("Property not found");
    }

    const newBuyer = new Buyer({
      userId: user._id,
      propertyId,
      documents,
      docusign,
      TC: timeOfTC,
    });
    const savedBuyer = await newBuyer.save();
    const result = {
      _id: savedBuyer._id,
      documents: savedBuyer.documents,
      docusign: savedBuyer.docusign,
      TC: savedBuyer.TC,
      isApproved: savedBuyer.isApproved,
      property: {
        _id: property._id,
        type: property.type,
        details: property.details,
        images: property.images,
        videos: property.videos,
        documents: property.documents,
      },
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
