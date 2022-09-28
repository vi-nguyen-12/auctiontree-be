const SiteMaintenance = require("../model/SiteMaintenance");

const createSiteMaintenance = async (req, res, next) => {
  try {
    const siteMaintenance = await SiteMaintenance.create({
      siteMaintenance: false,
      maintenanceMessage: "Site is currently under maintenance.",
    });
    const savedSiteMaintenance = await siteMaintenance.save();
    res.status(200).send(savedSiteMaintenance);
  } catch (err) {
    res.status(500).send(err);
  }
};

const getSiteMaintenance = async (req, res, next) => {
  try {
    const siteMaintenance = await SiteMaintenance.find();
    res.status(200).json({
      siteMaintenance: siteMaintenance,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

const updateSiteMaintenance = async (req, res, next) => {
  try {
    const siteMaintenance = await SiteMaintenance.findOne({
      name: "front-site",
    });
    siteMaintenance.siteMaintenance = req.body.siteMaintenance;
    const savedSiteMaintenance = await siteMaintenance.save();
    res.status(200).send({
      data: savedSiteMaintenance.siteMaintenance,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

module.exports = {
  getSiteMaintenance,
  updateSiteMaintenance,
  createSiteMaintenance,
};
