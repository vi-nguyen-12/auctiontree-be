const router= require('express').Router();
const User=require('../model/User')
const bcrypt= require('bcryptjs');
const jwt=require("jsonwebtoken");
const speakeasy = require("speakeasy");
const sgMail = require('@sendgrid/mail');

//@desc  Register a new user & create secret
//@route POST /api/user/register
const registerUser= async(req,res)=>{
    const emailExist=await User.findOne({email:req.body.email})
    if(emailExist){return res.status(400).send('Email already exists')}

    const salt = await bcrypt.genSaltSync(10);
    const hashedPassword = await bcrypt.hash(req.body.password,salt)
    const temp_secret= speakeasy.generateSecret();
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
           const token = speakeasy.totp({
        secret: savedUser.secret.base32,
        encoding: 'base32'
      });
      sgMail.setApiKey(process.env.SENDGRID_API_KEY)
      const msg = {
          to: user.email, 
          from: 'info@auction10x.com', 
          subject: 'Auction 10X Register',
          text: `Verify Code: ${token}`,
          }
      sgMail.send(msg)
          .then(() => {console.log('Email sent')})
          .catch((error) => {console.error(error)
  })
        res.send({userId:savedUser._id});
    }
    catch(err){
        res.status(400).send(err.message)
    }
}

// @desc  Verify token and activate user
// @route POST /api/user/verify
const verify=async(req,res)=>{
    const {token, email}=req.body;
    try{
        const user=await User.findOne({email})
        const {base32:secret}=user.secret;
        const verified = speakeasy.totp.verify({
            secret,
            encoding: 'base32',
            token
          }); 
        if(verified) {
            user.isActive=true;
            await user.save();
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
const login=async(req,res)=>{
    const user=await User.findOne({email:req.body.email})
    if(!user){return res.status(400).send("Email is not found")}
   
    const validPass=await bcrypt.compare(req.body.password,user.password)
    if(!validPass){return res.status(400).send("Invalid password")}
    if(!user.isActive){return res.status(400).send("User is verified")}
    return res.status(200).json({userId:_id})
}

//@desc  KYC is approved, send email notification
//@route POST /api/user/login


exports.registerUser=registerUser;
exports.login=login;
exports.verify=verify;