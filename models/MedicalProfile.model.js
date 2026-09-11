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

    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    categories: {
      type: [String],
    },

    sharedWith: [ {

      user: { 
        type: Schema.Types.ObjectId, 
        ref: "User", 
        required: true
      },
      
      permission: { 
        type: String, 
        enum: ["editor", "viewer"],
        default: "viewer",
        required: true
      }
       

    }],
  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`    
    timestamps: true
  }
);

const MedicalProfile = mongoose.model("MedicalProfile", medicalProfileSchema);

module.exports = MedicalProfile;