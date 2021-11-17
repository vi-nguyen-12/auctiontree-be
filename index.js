const express=require('express');
const mongoose=require('mongoose')
const dotenv=require('dotenv');
const authRoute=require("./routes/authRoutes");

const app =express();
dotenv.config();

mongoose.connect(process.env.DB_CONNECT,{
    useNewUrlParser:true
},()=>{console.log("Connected to DB")})


app.use(express.json());
app.use('/api/user',authRoute)


app.listen(5000,()=>console.log("Server is running..."))