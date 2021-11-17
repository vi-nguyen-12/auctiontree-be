const express=require('express');
const mongoose=require('mongoose')
const dotenv=require('dotenv');
const authRoute=require("./routes/authRoutes");

const app =express();
dotenv.config();

mongoose.connect(process.env.DB_CONNECT,{
    useNewUrlParser:true
},()=>{console.log("Connected to DB")})

app.use(express.json())
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });
app.use('/api/user',authRoute)
app.use('/test',()=>{console.log("test")})

app.listen(5000,()=>console.log("Server is running..."))