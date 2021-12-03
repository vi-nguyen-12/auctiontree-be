const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const userRoutes = require("./routes/userRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const kycRoute = require("./routes/kycRoutes");
const testRoute = require("./routes/test");
const cookieparser = require("cookie-parser");
const cors = require("cors");

const app = express();
app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(cookieparser());

mongoose.connect(
  process.env.DB_CONNECT,
  {
    useNewUrlParser: true,
  },
  () => {
    console.log("Connected to DB");
  }
);

app.use(express.json());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
app.use("/api/user", userRoutes);
app.use("/api/properties/real-estates/", propertyRoutes);
app.use("/api/kyc", kycRoute);
app.use("/api/test", testRoute);

app.listen(5000, () => console.log("Server is running..."));
