const Document = require("../model/Document");

//@desc  Create a document
//@route POST /api/documents body {name, officialName, url}
const createDocument = async (req, res) => {
  try {
    const { name, officialName, url } = req.body;
    const isDocumentExist = await Document.findOne({ officialName });
    if (isDocumentExist) {
      return res
        .status(200)
        .send({ error: `Document ${officialName} already exists` });
    }
    const document = new Document({ name, officialName, url });
    const newDocument = await document.save();
    res.status(200).send(newDocument);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//@desc  Edit a document
//@route PUT /api/documents/:id body {name, officialName, url}

const editDocument = async (req, res) => {
  try {
    const { name, officialName, url } = req.body;
    const newDocument = await Document.findByIdAndUpdate(
      req.params.id,
      { name, officialName, url },
      { new: true }
    );
    res.status(200).send(newDocument);
  } catch (err) {
    res.status(500).send(err.message);
  }
};
//@desc  Get all documents
//@route GET /api/documents?officialName=...
const getDocuments = async (req, res) => {
  try {
    const { officialName } = req.query;
    let filter = {};
    if (officialName) {
      filter.officialName = officialName;
    }
    const documents = await Document.find(filter);
    res.status(200).send(documents);
  } catch (err) {
    res.status(500).send(err);
  }
};

//@desc  Get a document
//@route GET /api/documents/:id
const getDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await Document.findById(id);
    if (!document) {
      return res.status(200).send({ error: "Document not found" });
    }
    res.status(200).send(document);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//@desc  Delete a document
//@route DELETE /api/documents/:id
const deleteDocument = async (req, res) => {
  try {
    await Document.deleteOne({ _id: req.params.id });
    res.status(200).send({ message: "Document deleted successfully" });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

module.exports = {
  createDocument,
  getDocuments,
  getDocument,
  editDocument,
  deleteDocument,
};
