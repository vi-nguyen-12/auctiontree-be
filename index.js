const express = require("express");
const app = express();
const socket = require("socket.io");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();

const userRoutes = require("./routes/userRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const kycRoute = require("./routes/kycRoutes");
const buyerRoute = require("./routes/buyerRoutes");
const auctionRoute = require("./routes/auctionRoutes");
const questionRoute = require("./routes/questionRoutes");
const docusignRoute = require("./routes/docusignRoutes");
const testRoute = require("./routes/test");
const cookieparser = require("cookie-parser");
const cors = require("cors");

// app.use(cors({ credentials: true, origin: "http://localhost:3000" }));

const allowedDomains = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://master.duhqplujt8olk.amplifyapp.com",
];

const corsOptions = {
  credentials: true,
  origin: (origin, callback) => {
    if (allowedDomains.includes(origin)) return callback(null, true);
    callback(new Error("Not allowed by CORS"));
  },
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieparser());

const port = process.env.PORT || 5000;

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
  // res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  const origin = req.headers.origin;
  if (allowedDomains.indexOf(origin) > -1) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
app.use("/api/users", userRoutes);
app.use("/api/properties/real-estates/", propertyRoutes);
app.use("/api/kyc", kycRoute);
app.use("/api/buyers", buyerRoute);
app.use("/api/questions", questionRoute);
app.use("/admin/api/questions", questionRoute);
app.use("/api/docusign", docusignRoute);
app.use("/api/test", testRoute);

if (process.env.NODE_ENV === "production") {
  app.use();
}
const server = app.listen(port, () => console.log("Server is running..."));

const io = socket(server, {
  cors: {
    credentials: true,
    origin: ["http://localhost:3000", "http://localhost:3001"],
  },
});

app.use(function (req, res, next) {
  req.io = io;
  next();
});

app.use("/api/auctions", auctionRoute);

// io.on("connection", (socket) => {
//   console.log("a new user is connected");
//   socket.on("bid", function ({ auctionId, number }) {
//     console.log("connect ok !!!");
//     console.log(socket.id);
//     console.log(number, auctionId);

//   });
//   socket.on("disconnect", function () {
//     console.log("user disconnected");
//   });
// });

//function of check everything if the bidding is ok
// let userId = "123";
// socket.emit("message", { number, auctionId });
// socket.broadcast.emit("message", { socketId: socket.id, userId, number });
