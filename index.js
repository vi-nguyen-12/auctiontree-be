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
const awsRoute = require("./routes/awsRoutes");
const testRoute = require("./routes/test");
const adminRoute = require("./routes/adminRoutes");
const faqRoute = require("./routes/faqRoutes");
const documentRoute = require("./routes/documentRoutes");
const subscriptionRoute = require("./routes/subscriptionRoutes");
const contactRoute = require("./routes/contactRoutes");
const emailRoute = require("./routes/emailRoutes");
const emailTemplateRoute = require("./routes/emailTemplateRoutes");
const pageContentRoute = require("./routes/pageContentRoutes");
const teamMemberRoute = require("./routes/teamMemberRoutes");
const roleRoute = require("./routes/roleRoutes");
const siteRoute = require("./routes/siteRoutes");
const permissionRoute = require("./routes/permissionRoutes");
// const chatRoute = require("./routes/chatRoutes");
const {
  remindUpcomingAuction,
  remindPendingProperties,
  deletePendingProperties,
  sendSubscriptionEmail,
} = require("./cron-jobs");
const cookieparser = require("cookie-parser");
const cors = require("cors");

app.use(function (req, res, next) {
  if (!req.headers["x-forwarded-proto"]) {
    req.headers["x-forwarded-proto"] = "https";
  }
  return next();
});
let allowedDomains = [];

if (process.env.NODE_ENV === "test" || process.env.NODE_ENV == "production") {
  allowedDomains = [
    process.env.DEV_CLIENT_URL,
    process.env.TEST_CLIENT_URL,
    process.env.PROD_CLIENT_URL,
    process.env.DEV_CLIENT_ADMIN_URL,
    process.env.TEST_CLIENT_ADMIN_URL,
    process.env.PROD_CLIENT_ADMIN_URL,
    "https://demo.docusign.net/restapi",
    "https://master.d2kn8k5vvfikc0.amplifyapp.com",
    "https://master.d2n2iz8kdj82to.amplifyapp.com",
    "http://192.168.1.168:3000",
    "http://192.168.1.75:3000",
  ];

  const corsOptions = {
    credentials: true,
    origin: (origin, callback) => {
      if (allowedDomains.includes(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
  };
  app.use(cors(corsOptions));
} else {
  app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
}

app.set("trust proxy", 1);

// set cron job //just comment out for temporarily
// remindUpcomingAuction();
// remindPendingProperties();
// deletePendingProperties();
// sendSubscriptionEmail();

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
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
  const origin = req.headers.origin;
  if (allowedDomains.indexOf(origin) > -1) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header(
    "Access-Control-Allow-Headers",
    "Access-Control-Allow-Credentials",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Expose-Headers", "*");
  // res.header("Cache-Control", "public, max-age=31536000");
  next();
});

app.use("/api/users", userRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/kyc", kycRoute);
app.use("/api/buyers", buyerRoute);
app.use("/api/questions", questionRoute);
app.use("/admin/api/questions", questionRoute);
app.use("/api/docusign", docusignRoute);
app.use("/api/test", testRoute);
app.use("/api/aws", awsRoute);
app.use("/api/admins", adminRoute);
app.use("/api/faqs", faqRoute);
app.use("/api/documents", documentRoute);
app.use("/api/subscriptions", subscriptionRoute);
app.use("/api/contacts", contactRoute);
app.use("/api/emails", emailRoute);
app.use("/api/emailTemplates", emailTemplateRoute);
app.use("/api/pageContents", pageContentRoute);
app.use("/api/teamMembers", teamMemberRoute);
app.use("/api/roles", roleRoute);
app.use("/api/permissions", permissionRoute);
app.use("/api/maintenance", siteRoute);

// if (process.env.NODE_ENV === "production") {
//   app.use();
// }
const server = app.listen(port, () => console.log("Server is running..."));

const io = socket(server, {
  cors: {
    credentials: true,
    origin: [
      process.env.DEV_CLIENT_URL,
      process.env.PROD_CLIENT_URL,
      process.env.TEST_CLIENT_URL,
      "http://localhost:3001",
    ],
  },
});

app.use(function (req, res, next) {
  req.io = io;
  next();
});

app.use("/api/auctions", auctionRoute);
// app.use("/api/chats", chatRoute);

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
