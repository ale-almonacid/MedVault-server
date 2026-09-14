
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
      default: "https://res.cloudinary.com/demo/image/upload/v1/default-avatar.png", // replace later form cloudiranry
    }
  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`    
    timestamps: true
  }
);

const User = model("User", userSchema);

module.exports = User;
