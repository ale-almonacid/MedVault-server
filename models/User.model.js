
const { Schema, model } = require("mongoose");

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required.']
    },

    username: {
      type: String,
      required: [true, 'username is required.'],
    },

    avatar:{
      type: String,
      default: "https://res.cloudinary.com/w0hsyj9p/image/upload/v1789573770/avatar-default.svg", // replace later form cloudiranry
    }
  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`    
    timestamps: true
  }
);

const User = model("User", userSchema);

module.exports = User;
