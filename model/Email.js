const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const emailSchema = new Schema(
  {
    sender: {
      _id: {
        type: Schema.Types.ObjectId,
        refPath: "senderModel",
      },
      name: { type: String },
      company: { type: String },
      email: { type: String },
      phone: { type: String },
    },
    senderModel: {
      type: String,
      required: function () {
        if (this.sender._id) {
          return true;
        }
        return false;
      },
      enum: ["User", "Admin"],
    },
    recipients: {
      type: [
        {
          _id: {
            type: Schema.Types.ObjectId,
            refPath: "recipientsModel",
          },
          email: { type: String },
        },
      ],
    },
    recipientsModel: {
      type: String,
      required: true,
      enum: ["User", "Admin"],
    },
    content: { type: String, required: true },
  },
  { timestamp: true }
);
emailSchema.pre("save", function (next) {
  if (this.sender._id) {
    if (
      this.sender.name ||
      this.sender.company ||
      this.sender.email ||
      this.sender.phone
    ) {
      next(
        new Error("Name or email or phone is no required")
      );
    }
  } else {
    if (!this.sender.name || !this.sender.email) {
      new Error("Name and email is required");
    }
  }
  for (let recipient of this.recipients) {
    if (recipient._id) {
      if (recipient.email) {
        next(new Error("Email is no required"));
      }
    } else {
      if (!recipient.email) {
        new Error(" Email is required");
      }
    }
  }

  next();
});

module.exports = mongoose.model("Email", emailSchema);
