const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const siteMaintenanceSchema = new Schema({
    name:{type:String, required:true,default:"front-site"},
  siteMaintenance: { type: Boolean, required: true, default: false },
  maintenanceMessage: {
    type: String,
    required: false,
    default: "Site is currently under maintenance.",
  },
});

module.exports = mongoose.model("SiteMaintenance", siteMaintenanceSchema);
