const express = require("express")
const router = require("express").Router();

//Cloudinary middleware

const { uploadDocument, cloudinary } = require("../middleware/cloudinary.middleware");

// Authentication middleware
const { verifyToken } = require("../middleware/auth.middleware");

//model
const Document = require("../models/Document.model");
const MedicalProfile = require("../models/MedicalProfile.model");

//routes


// GET Documents by Profile & Category
// /api/documents?medicalProfile=123&category=Lab Results

router.get("/", verifyToken, async (req, res, next) => {
  try {
    const { medicalProfile, category } = req.query;
    const userId = req.payload._id;

    if (!medicalProfile) {
      return res.status(400).json({ message: "medicalProfile query parameter is required." });
    }

    // Verify user has read access
    const profile = await MedicalProfile.findOne({
      _id: medicalProfile,
      $or: [{ editors: userId }, { viewers: userId }],
    });

    if (!profile) {
      return res.status(403).json({ message: "Access denied or medical profile not found." });
    }

    const filter = { medicalProfile };
    if (category) filter.category = category;

    const documents = await Document.find(filter)
      .populate("uploadedBy", "username email avatar")
      .sort({ createdAt: -1 });

    res.status(200).json(documents);
  } catch (error) {
    next(error);
  }
});


// GET One Single Document (/api/documents/:documentId)

router.get("/:documentId", verifyToken, async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const userId = req.payload._id;

    const document = await Document.findById(documentId).populate("uploadedBy", "username email avatar");
    if (!document) {
      return res.status(404).json({ message: "Document not found." });
    }

    // Check read permissions on associated profile
    const profile = await MedicalProfile.findOne({
      _id: document.medicalProfile,
      $or: [{ editors: userId }, { viewers: userId }],
    });

    if (!profile) {
      return res.status(403).json({ message: "Access denied." });
    }

    res.status(200).json(document);
  } catch (error) {
    next(error);
  }
});


// POST Upload / Create Document /api/documents)

router.post("/", verifyToken, uploadDocument.single("file"), async (req, res, next) => {
  try {
    const { medicalProfile, title, date, category, language, notes } = req.body;
    const userId = req.payload._id;

    if (!req.file) {
      return res.status(400).json({ message: "A document file (PDF or image) is required." });
    }

    if (!medicalProfile) {
      return res.status(400).json({ message: "medicalProfile ID is required." });
    }

    // Verify user is an editor
    const profile = await MedicalProfile.findOne({
      _id: medicalProfile,
      editors: userId,
    });

    if (!profile) {
      return res.status(403).json({ message: "Access denied or medical profile not found." });
    }

    const newDocument = await Document.create({
      title,
      date,
      category,
      language,
      notes,
      fileUrl: req.file.path,
      cloudinaryPublicId: req.file.filename,
      medicalProfile,
      uploadedBy: userId,
    });

    res.status(201).json(newDocument);
  } catch (error) {
    next(error);
  }
});

// PATCH Edit Document information (/api/documents/:documentId)

router.patch("/:documentId", verifyToken, uploadDocument.single("file"), async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const userId = req.payload._id;
    const { title, date, category, language, notes } = req.body;

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: "Document not found." });
    }

    // Verify user is an editor
    const profile = await MedicalProfile.findOne({
      _id: document.medicalProfile,
      editors: userId,
    });

    if (!profile) {
      return res.status(403).json({ message: "Access denied. Only editors can modify documents." });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (date) updateData.date = date;
    if (category) updateData.category = category;
    if (language) updateData.language = language;
    if (notes !== undefined) updateData.notes = notes;

    // for files 
      if (req.file) {
        // Delete the old file from Cloudinary to clean up storage
        if (document.cloudinaryPublicId) {
          const isPdf = document.fileUrl.toLowerCase().endsWith(".pdf");
          await cloudinary.uploader.destroy(document.cloudinaryPublicId, {
            resource_type: isPdf ? "raw" : "image",
          });
        }

        // Set the new file details in the update payload
        updateData.fileUrl = req.file.path;
        updateData.cloudinaryPublicId = req.file.filename;
      }


    const updatedDocument = await Document.findByIdAndUpdate(
      documentId,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedDocument);
  } catch (error) {
    next(error);
  }
});


// DELETE delete a Document (/api/documents/:documentId)

router.delete("/:documentId", verifyToken, async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const userId = req.payload._id;

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: "Document not found." });
    }

    // Verify user is an editor
    const profile = await MedicalProfile.findOne({
      _id: document.medicalProfile,
      editors: userId,
    });

    if (!profile) {
      return res.status(403).json({ message: "Access denied. Only editors can delete documents." });
    }

    // Clean up file in Cloudinary
    if (document.cloudinaryPublicId) {
      const isPdf = document.fileUrl.toLowerCase().endsWith(".pdf");
      await cloudinary.uploader.destroy(document.cloudinaryPublicId, {
        resource_type: isPdf ? "raw" : "image",
      });
    }

    await Document.findByIdAndDelete(documentId);

    res.status(200).json({ message: "Document successfully deleted." });
  } catch (error) {
    next(error);
  }
});


// export
module.exports = router 