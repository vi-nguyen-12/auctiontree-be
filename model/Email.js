const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const emailSchema = new Schema(
  {
    sender: {
      _id: {
        type: Schema.Types.ObjectId,
        refPath: "senderModel",
        required: true,
      },
      firstName: { type: String },
      lastName: { type: String },
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
            required: true,
          },
          firstName: { type: String },
          lastName: { type: String },
          email: { type: String },
          phone: { type: String },
        },
      ],
    },
    recipientsModel: {
      type: String,
      required: function () {
        if (this.sender._id) {
          return true;
        }
        return false;
      },
      enum: ["User", "Admin"],
    },
    content: { type: String, required: true },
  },
  { timestamp: true }
);
emailSchema.pre("save", function (next) {
  if (this.sender._id) {
    if (
      this.sender.firstName ||
      this.sender.lastName ||
      this.sender.email ||
      this.sender.phone
    ) {
      next(
        new Error("First name or last name or email or phone is no required")
      );
    }
  } else {
    if (!this.sender.firstName || !this.sender.lastName || !this.sender.email) {
      new Error("First name and last name and email is required");
    }
  }
  for (let recipient of this.recipients) {
    if (recipient._id) {
      if (
        recipient.firstName ||
        recipient.lastName ||
        recipient.email ||
        recipient.phone
      ) {
        next(
          new Error("First name or last name or email or phone is no required")
        );
      }
    } else {
      if (!recipient.firstName || !recipient.lastName || !recipient.email) {
        new Error("First name and last name and email is required");
      }
    }
  }

  next();
});

module.exports = mongoose.model("Email", emailSchema);
