const mongoose=require('mongoose');

const propertySchema=new mongoose.Schema({
    type:{type:String,required:true},
    // files:{type:String, require:true}
})

module.exports=mongoose.model('Property', propertySchema)