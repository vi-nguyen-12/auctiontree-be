const mongoose=require('mongoose');

const propertySchema=new mongoose.Schema({
    // userId: {type:String, required: true}  who possesses that property
    type:{type:String,required:true},
    //details: {tyoe: Object} details of property: key-value
    // files:{type: Object} array of locations in S3
})

module.exports=mongoose.model('Property', propertySchema)