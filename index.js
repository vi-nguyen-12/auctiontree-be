const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const socket = require("socket.io");
const { join_User, get_Current_User, user_Disconnect } = require("./dummyuser");
dotenv.config();

const userRoutes = require("./routes/userRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const kycRoute = require("./routes/kycRoutes");
const buyerRoute = require("./routes/buyerRoutes");
const auctionRoute = require("./routes/auctionRoutes");
const testRoute = require("./routes/test");
const cookieparser = require("cookie-parser");
const cors = require("cors");

const app = express();
app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
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
app.use("/api/buyers", buyerRoute);
app.use("/api/auctions", auctionRoute);
app.use("/admin/api/auctions", auctionRoute);
app.use("/api/test", testRoute);

app.listen(5000, () => console.log("Server is running..."));

// const server = app.listen(5000, () => console.log("Server is running..."));

// const io = socket(server);
// io.on("connection", (socket) => {});
