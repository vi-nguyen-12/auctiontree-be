const schedule = require("node-schedule");
const Auction = require("./model/Auction.js");
const Buyer = require("./model/Buyer.js");
const { sendEmail } = require("./helper.js");
const Property = require("./model/Property.js");

//send email for pending properties over 15 days.
const remindPendingProperties = async () => {
  try {
    const pendingProperties = await Property.aggregate([
      {
        $match: {
          step: { $in: [1, 2, 3, 4] },
          updatedAt: {
            $lte: new Date(new Date().setDate(new Date().getDate() - 15)),
            $gte: new Date(new Date().setDate(new Date().getDate() - 16)),
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "seller",
          pipeline: [
            {
              $project: {
                _id: "$_id",
                email: "$email",
                firstName: "$firstName",
                lastName: "$lastName",
              },
            },
          ],
        },
      },
      {
        $unwind: { path: "$seller" },
      },
      {
        $project: {
          _id: "$_id",
          seller: "$seller",
        },
      },
    ]);
    for (let item of pendingProperties) {
      const { email, firstName, lastName } = item.seller;
      const subject = "Auction3: Reminder for pending property";
      const text = `Hi ${firstName} ${lastName},
      This is a reminder you have one property which is pending for more than 15 days. It will be deleted after 30 days.
      Please check your property and update the status.
      `;
      sendEmail({ email, subject, text });
    }
  } catch (err) {
    console.log(err);
  }
};
//delete pending properties over 30 days.
const deletePendingProperties = async () => {
  try {
    let date = new Date().setDate(new Date().getDate() - 30);
    await Property.deleteMany({
      step: { $in: [1, 2, 3, 4] },
      updatedAt: {
        $lte: date,
      },
    });
  } catch (err) {
    console.log(err);
  }
};

// send email to remind user about the upcoming auction which they own property or they've registered to buy
const remindUpcomingAuction = async () => {
  try {
    let now = new Date();
    let upcomingAuctions;

    // 1 day before the auction starts == get all auctions with start day 1 -> 2 days ahead, and we'll have to restart server end of day anyway
    const listOfDaysBefore = [
      { startDate: 1, endDate: 2 },
      { startDate: 3, endDate: 4 },
      { startDate: 5, endDate: 6 },
      { startDate: 10, endDate: 11 },
      { startDate: 15, endDate: 16 },
    ];
    for (let day of listOfDaysBefore) {
      let startTime = now.setHours(now.getHours() + day.startDate * 24);
      let endTime = now.setHours(now.getHours() + day.endDate * 24);

      upcomingAuctions = await Auction.aggregate([
        // match auctionStartDate
        {
          $match: {
            auctionStartDate: {
              $gte: new Date(startTime),
              $lte: new Date(endTime),
            },
          },
        },
        // lookup for propertyId
        {
          $lookup: {
            from: "properties",
            localField: "property",
            foreignField: "_id",
            as: "property",
            pipeline: [
              {
                //lookup for userId
                $lookup: {
                  from: "users",
                  localField: "createdBy",
                  foreignField: "_id",
                  as: "user",
                  pipeline: [
                    {
                      $project: {
                        _id: "$_id",
                        email: "$email",
                        firstName: "$firstName",
                        lastName: "$lastName",
                      },
                    },
                  ],
                },
              },
              { $unwind: { path: "$user" } },
              {
                $project: {
                  _id: "$_id",
                  createdBy: "$user",
                },
              },
            ],
          },
        },
        { $unwind: { path: "$property" } },
        // lookup for buyers
        {
          $lookup: {
            from: "buyers",
            localField: "_id",
            foreignField: "auctionId",
            as: "buyers",
            pipeline: [
              {
                $lookup: {
                  from: "users",
                  localField: "userId",
                  foreignField: "_id",
                  as: "user",
                },
              },
              { $unwind: { path: "$user" } },
              {
                $project: {
                  _id: "$_id",
                  email: "$user.email",
                  firstName: "$user.firstName",
                  lastName: "$user.lastName",
                },
              },
            ],
          },
        },
        {
          $project: {
            _id: "$_id",
            auctionStartDate: "$auctionStartDate",
            property: "$property",
            buyers: "$buyers",
          },
        },
      ]);

      for (let auction of upcomingAuctions) {
        let time = new Date(
          auction.auctionStartDate - day.startDate * 24 * (60 * 60 * 1000)
        );
        schedule.scheduleJob(time, () => {
          let emailList = auction.buyers.map((buyer) => buyer.email);
          emailList.push(auction.property.createdBy.email);
          sendEmail({
            email: emailList,
            subject: "Reminder: Auction Starts in 24 hours",
            content: `Hi ,\n\nThis is a reminder that your auction for ${
              auction.property.address
            } is starting in ${
              day.startDate === 1 ? "24 hours" : `${day.startDate} days`
            }.\n\nPlease login to your account to view the auction details.\n\nThank you,\n\nThe Property Auction Team`,
          });
          console.log("send remind email");
        });
      }
    }
  } catch (err) {
    console.log(err.message);
  }
};

// send subscription email everyday/per 2 days about new auctions or just upcoming auctions ???
const sendSubscriptionEmail = async () => {
  try {
    const emails = await Subscription.find();
    for (let email of emails) {
      // sendEmail({
      //   email,
      //   subject: "Auction3X - Latest news",
      //   text: "List of upcoming auctions",
      // });
    }
  } catch (err) {
    console.log(err.message);
  }
};
module.exports = {
  remindUpcomingAuction,
  remindPendingProperties,
  deletePendingProperties,
  sendSubscriptionEmail,
};
