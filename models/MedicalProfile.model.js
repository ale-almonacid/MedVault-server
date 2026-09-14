const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const medicalProfileSchema = new Schema(
  {
    subjectName: {
      type: String,
      required: [true, 'Name is required.'],
    },

    description: {
      type: String,
    },

    editors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      }
    ],

    viewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    categories: {
      type: [String],
    },

    
  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`    
    timestamps: true
  }
);

const MedicalProfile = mongoose.model("MedicalProfile", medicalProfileSchema);

module.exports = MedicalProfile;