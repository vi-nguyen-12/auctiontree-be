const router= require('express').Router();
const User=require('../model/User')
const bcrypt= require('bcryptjs');
const jwt=require("jsonwebtoken");
const speakeasy = require("speakeasy");
const sgMail = require('@sendgrid/mail');

//@desc  Register a new user & create temp secret
//@route POST /api/user/register
const registerUser= async(req,res)=>{
    const emailExist=await User.findOne({email:req.body.email})
    if(emailExist){return res.status(400).send('Email already exists')}

    const salt = await bcrypt.genSaltSync(10);
    const hashedPassword = await bcrypt.hash(req.body.password,salt)
    const temp_secret= speakeasy.generateSecret();
    console.log(temp_secret)
    const user=new User({
        firstName:req.body.firstName,
        lastName:req.body.lastName,
        email:req.body.email,
        phone:req.body.phone,
        password:hashedPassword,
        bidderName:req.body.bidderName || req.body.firstName,
        country:req.body.country,
        city:req.body.city,
        secret:temp_secret
    })

    try{
        const savedUser=await user.save();
        console.log(savedUser.secret)
        res.send({userId:savedUser.id, secret: savedUser.secret.base32});
    }
    catch(err){
        res.status(400).send(err.message)
    }
}

// @desc  Create token and send to user via email
// @route POST /api/user/sendToken
const sendToken= async(req,res)=>{
    const {userId}=req.body;
    const user=await User.findOne({_id:userId})
    var token = speakeasy.totp({
        secret: user.secret.base32,
        encoding: 'base32'
      });
      console.log(token,user.secret.base32 )

    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    const msg = {
        to: user.email, 
        from: 'vienne@labs196.com', 
        subject: 'Auction 10X Register',
        text: `Verify Code: ${token}`,
        }
    sgMail.send(msg)
        .then(() => {console.log('Email sent')})
        .catch((error) => {console.error(error)
    return res.json({token, userId})
})
}

// @desc  Verify token and make secret permanent
// @route POST /api/user/verify
const verify=async(req,res)=>{
    const {token, userId}=req.body;
    console.log(token,userId)
    try{
        const user=await User.findOne({_id:userId})
        console.log(user.secret.base32)
        const {base32:secret}=user.secret;
        const verified = speakeasy.totp.verify({
            secret,
            encoding: 'base32',
            token
          }); 
        if(verified) {
            user.isActive=true;
            return res.json({verified: true});
        }else{
            return res.json({verified: false})
        }
    }
    catch(error){
        return res.status(500).json({message:error.message})
    }
}

//@desc  Log in
//@route POST /api/user/login
const authUser=async(req,res)=>{
    const user=await User.findOne({email:req.body.email})
    if(!user){return res.status(400).send("Email is not found")}
   
    const validPass=await bcrypt.compare(req.body.password,user.password)
    if(!validPass){return res.status(400).send("Invalid password")}
    return res.status(200).json({userId:_id})
}

// @desc  Verify token and make secret permanent
// @route POST /api/user/validate
const validate=async(req,res)=>{
    const {token, userId}=req.body;
    console.log(token,userId)
    try{
        const user=await User.findOne({_id:userId})
        const {base32:secret}=user.secret;
        const verified = speakeasy.totp.verify({
            secret,
            encoding: 'base32',
            token
          }); 
        if(verified) {
            return res.json({verified: true});
        }else{
            return res.json({verified: false})
        }
    }
    catch(error){
        return res.status(500).json({message:error.message})
    }
}

exports.registerUser=registerUser;
exports.authUser=authUser;
exports.verify=verify;
exports.sendToken=sendToken;
exports.validate=validate;