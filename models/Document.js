const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const documentSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required.'],
    },

    date: {
      type: Date,
      required: [true, 'Date is required.'],
    },

    category: {
        type: String,
        required: [true, 'Category is required.'],
    },

    
    fileUrl: {
        type: [String],
        required: [true, 'file is required.'],
    },
    
    language: {
      type: String,
    },

    notes: {
      type: [String],
    },

    medicalProfile:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "MedicalProfile"
    },

    uploadedBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    
  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`    
    timestamps: true
  }
);

const Document = mongoose.model("Document", documentSchema);

module.exports = Document;