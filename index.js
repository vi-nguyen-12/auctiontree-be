const express=require('express');
const mongoose=require('mongoose')
const dotenv=require('dotenv');
const userRoutes=require("./routes/userRoutes");
const uploadRoutes=require("./routes/uploadRoutes");
const cookieparser=require("cookie-parser");
const cors=require("cors")

const app =express();
app.use(cors({credentials:true, origin: "http://localhost:3000"}))
app.use(cookieparser());

dotenv.config();

mongoose.connect(process.env.DB_CONNECT,{
    useNewUrlParser:true
},()=>{console.log("Connected to DB")})

app.use(express.json())
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });
app.use('/api/user',userRoutes)
// app.use("/api/upload", uploadRoutes)

app.listen(5000,()=>console.log("Server is running..."))