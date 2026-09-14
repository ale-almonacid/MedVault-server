// middlewares/cloudinary.config.js

const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

// Storage for Avatars
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    allowed_formats: ["jpg", "png", "jpeg"],
    folder: "medvault-avatars", 
  },
});

// Storage for Documents
const documentStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    allowed_formats: ["jpg", "png", "jpeg", "pdf"],
    folder: "medvault-documents", 
    resource_type: "auto",         
  },
});

module.exports = {
  uploadAvatar: multer({ storage: avatarStorage }),
  uploadDocument: multer({ storage: documentStorage }),
  cloudinary, // Exported to allow physical file deletion via SDK on DELETE
};