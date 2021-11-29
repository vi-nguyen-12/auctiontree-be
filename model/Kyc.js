const mongoose = require('mongoose');
const kycSchema =  new mongoose.Schema(
    {
      userId: { type: String, required: true },
      kycId: { type: String, unique: true, required: true },    
      status: { type: String, default: "PENDING" },
      result: { type: Object },
      createdAt :  {
        type: Date, 
        default: Date.now
      },
      updatedAt: {
        type: Date, 
        default: Date.now
      },
    }
  );
  
module.exports = mongoose.model('Kyc',kycSchema);