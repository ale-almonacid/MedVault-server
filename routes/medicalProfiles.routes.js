const express = require("express");
const router = require("express").Router();

//Models
const MedicalProfile = require("../models/MedicalProfile.model");
const User = require("../models/User.model");

// Authentication middleware
const { verifyToken } = require("../middleware/auth.middleware");

//------------------ Routes -------------------------

// GET all medical profiles of a user (/api/medical-profiles)
router.get("/", verifyToken, async (req, res, next) => {
  try {
    const userId = req.payload._id;
    const response = await MedicalProfile.find({
      $or: [{ editors: userId }, { viewers: userId }],
    })
      .populate("editors", "username avatar")
      .populate("viewers", "username avatar");
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

// GET 1 medical profile details (/api/medical-profiles/:medicalProfileId)

router.get("/:medicalProfileId", verifyToken, async (req, res, next) => {
  try {
    const userId = req.payload._id;
    const response = await MedicalProfile.findOne({
      _id: req.params.medicalProfileId, // explicit id is better
      $or: [{ editors: userId }, { viewers: userId }],
    })
      .populate("editors", "username avatar")
      .populate("viewers", "username avatar");
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

// POST Create a medical profile (/api/medical-profiles)

router.post("/", verifyToken, async (req, res, next) => {
  try {
    const userId = req.payload._id;
    const { subjectName, description, categories, sharedWith } = req.body; // no need to destructure owner because here is only for the user editable fields
    const response = await MedicalProfile.create({
      subjectName,
      description,
      categories,
      editors: [userId], // Authenticated user starts as the primary editor
      viewers:[],
    });
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// PATCH Edit Basic Profile Info (Name & Description) (/api/medical-profiles/:medicalProfileId)

router.patch("/:medicalProfileId", verifyToken, async (req, res, next) => {
  try {
    const userId = req.payload._id;
    const { medicalProfileId } = req.params;
    const { subjectName, description } = req.body;

    const response = await MedicalProfile.findOneAndUpdate(
    {
        _id: medicalProfileId,
        editors: userId, // Must be an editor to update
      },
      { subjectName, description },
      { runValidators: true, returnDocument: "after" }
    );

    if (!response) {
      res
        .status(404)
        .json({ message: "Medical profile not found or permission denied." });
      return;
    }

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

// PATCH Edit (add and remove) categories of profile (/api/medical-profiles/:medicalProfileId/categories)

router.patch(
  "/:medicalProfileId/categories",
  verifyToken,
  async (req, res, next) => {
    try {
      const userId = req.payload._id;
      const { medicalProfileId } = req.params;
      const { categories } = req.body;

      const response = await MedicalProfile.findOneAndUpdate(
        {
          _id: medicalProfileId,
          editors: userId,
          
        },
        {
          categories,
        },
        {
          runValidators: true,
          returnDocument: "after",
        },
      );

      if (!response) {
        res
          .status(404)
          .json({ message: "Medical profile not found or permission denied." });
        return;
      }

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
);

//DELETE  Delete a medical profile (/api/medical-profiles/:medicalProfileId)

router.delete("/:medicalProfileId", verifyToken, async (req, res, next) => {
  try {
    const userId = req.payload._id;
    const { medicalProfileId } = req.params;
    const response = await MedicalProfile.findOneAndDelete({
      _id: medicalProfileId,
      editors: userId,
    });

    if (!response) {
      return res
        .status(404)
        .json({ message: "Medical profile not found or permission denied." });
    }

    res.status(200).json({ message: "Medical profile deleted successfully." });
  } catch (error) {
    next(error);
  }
});

//-------------------------------

// Routes share medical profile

//---------------------------------

//POST Add / Grant Profile Permission (/api/medical-profiles/:medicalProfileId/share)

router.post("/:medicalProfileId/share", verifyToken, async (req, res, next) => {
  try {
    const userId = req.payload._id;
    const { medicalProfileId } = req.params;
    const { emailToShareWith, role } = req.body;

    if (!["editor", "viewer"].includes(role)) {
      return res.status(400).json({ message: "Role must be 'editor' or 'viewer'." });
    }

    // Find the user by email to get their _id
    const userToShareWith = await User.findOne({ email: emailToShareWith });
    if (!userToShareWith) {
      return res.status(404).json({ message: "User with that email does not exist." });
    }

    const recipientId = userToShareWith._id;

    // 2. Prevent adding a user to both lists simultaneously
    const targetArray = role === "editor" ? "editors" : "viewers";
    const oppositeArray = role === "editor" ? "viewers" : "editors";

    const response = await MedicalProfile.findOneAndUpdate(
      {
        _id: medicalProfileId,
        editors: userId, // Requesting user must be an editor
      },
      {
        $addToSet: { [targetArray]: recipientId }, // Adds without creating duplicates
        $pull: { [oppositeArray]: recipientId },    // Removes from other list if present
      },
      
      { runValidators: true, returnDocument: "after" },
    );

    if (!response) {
      return res
        .status(404)
        .json({ message: "Medical profile not found or permission denied." });
    }
    res.status(200).json({ message: `permission granted as ${role}.`, profile: response });
  } catch (error) {
    next(error);
  }
});


//PATCH Update Permission (Switch between 'editor' and 'viewer') (/api/medical-profiles/:medicalProfileId/share/:recipientUserId)

router.patch("/:medicalProfileId/share/:recipientUserId", verifyToken, async (req, res, next) => {
  try {
    const userId = req.payload._id;
    const { medicalProfileId, recipientUserId } = req.params;
    const { role } = req.body;

    if (!["editor", "viewer"].includes(role)) {
      return res.status(400).json({ message: "Role must be 'editor' or 'viewer'." });
    }

    const targetArray = role === "editor" ? "editors" : "viewers";
    const oppositeArray = role === "editor" ? "viewers" : "editors";

    const response = await MedicalProfile.findOneAndUpdate(
      {
        _id: medicalProfileId,
        editors: userId,
      },
      {
        $addToSet: { [targetArray]: recipientUserId },
        $pull: { [oppositeArray]: recipientUserId },
      },
      
      { runValidators: true, returnDocument: "after" },
    );

    if (!response) {
      return res
        .status(404)
        .json({ message: "Medical profile not found or permission denied." });
    }
    res.status(200).json({ message: `Role updated to ${role}.` });
  } catch (error) {
    next(error);
  }
});


//DELETE Revoke Delegate Access(/api/medical-profiles/:medicalProfileId/share/:recipientUserId)

router.delete("/:medicalProfileId/share/:recipientUserId", verifyToken, async (req, res, next) => {
  try {
    const userId = req.payload._id;
    const { medicalProfileId, recipientUserId } = req.params;
    

    const response = await MedicalProfile.findOneAndUpdate(
        {
        _id: medicalProfileId,
        editors: userId,
      },
        {
        $pull: {
          editors: recipientUserId,
          viewers: recipientUserId,
        },
      },
      
      { runValidators: true, returnDocument: "after" },
    );

    if (!response) {
      return res
        .status(404)
        .json({ message: "Medical profile not found or permission denied." });
    }
    res.status(200).json({ message: "Access revoked successfully", profile: response });
  } catch (error) {
    next(error);
  }
});




// export
module.exports = router;
