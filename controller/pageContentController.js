const PageContent = require("../model/PageContent");
const Joi = require("joi");

//@desc  Create a page content
//@route POST /api/pageContent body {name, htmlText}
const createPageContent = async (req, res) => {
  try {
    const { name, htmlText } = req.body;
    const bodySchema = Joi.object({
      name: Joi.string()
        .required()
        .valid(
          "team",
          "contact_us",
          "about_us",
          "TC_buying",
          "TC_selling",
          "TC_user",
          "terms_of_use",
          "privacy_policy",
          "US_cookie_policy",
          "international_cookie_policy",
          "disclaimer"
        ),
      htmlText: Joi.string().required(),
    });
    const { error } = bodySchema.validate(req.body);
    if (error) {
      return res.status(200).send({ error: error.details[0].message });
    }

    //check if page content is existing
    const isPageContentExists = await PageContent.findOne({ name });
    if (isPageContentExists) {
      return res.status(200).send({ error: "Page content already exists" });
    }
    const newPageContent = new PageContent({ name, htmlText });
    const savedPageContent = await newPageContent.save();
    res.status(200).send(savedPageContent);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//@desc  Get page contents
//@route GET /api/pageContent?name=...

const getPageContents = async (req, res) => {
  try {
    const { name } = req.query;
    let filter = {};
    if (name) {
      filter.name = name;
    }
    const pageContents = await PageContent.find(filter);
    res.status(200).send(pageContents);
  } catch (err) {
    res.status(500).send(err);
  }
};

//@desc  Edit a page content
//@route PUT /api/pageContent/:id body {name, htmlText}
const editPageContent = async (req, res) => {
  try {
    const { name, htmlText } = req.body;
    const bodySchema = Joi.object({
      name: Joi.string()
        .required()
        .valid(
          "team",
          "contact_us",
          "about_us",
          "TC_buying",
          "TC_selling",
          "TC_user",
          "terms_of_use",
          "privacy_policy",
          "US_cookie_policy",
          "international_cookie_policy",
          "disclaimer"
        ),
      htmlText: Joi.string().required(),
    });
    const { error } = bodySchema.validate(req.body);
    if (error) {
      return res.status(200).send({ error: error.details[0].message });
    }

    const updatedPageContent = await PageContent.findByIdAndUpdate(
      req.params.id,
      { name, htmlText }
    );
    res.status(200).send(updatedPageContent);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//@desc  Delete a page content
//@route DELETE /api/pageContent/:id
const deletePageContent = async (req, res) => {
  try {
    await PageContent.deleteOne({ _id: req.params.id });
    return res.status(200).send({ message: "Content deleted successfully" });
  } catch (err) {
    return res.status(500).send(err.message);
  }
};

module.exports = {
  createPageContent,
  getPageContents,
  editPageContent,
  deletePageContent,
};
