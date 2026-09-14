const express = require("express")
const router = require("express").Router();

//password 
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")


//Models
const User = require("../models/User.model");
const MedicalProfile = require("../models/MedicalProfile.model");

// Authentication middleware
const { verifyToken } = require("../middleware/auth.middleware");

//Cloudinary middleware
const { uploadAvatar } = require("../middleware/cloudinary.middleware");

//------------------ Routes -------------------------

// GET Fetch user details (/api/users/me)
router.get("/me", verifyToken, async (req, res, next) => {
  try {
    const userId = req.payload._id;

    const response = await User.findById(userId).select("-password")
    if (!response) {
      return res.status(404).json({ message: "User not found." });
    }


    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});


// PATCH  Edit username (/api/users/me)
router.patch("/me", verifyToken, async (req, res, next) => {

    try {

        const userId = req.payload._id;
        const {username} = req.body

        const response = await User.findByIdAndUpdate(
            userId,
            {username},
            {
            runValidators: true,
            new: true,
          },
        ).select("-password"); // Excludes password hash from response

        if (!response){
           return res.status(404).json({ message: "User not found." }); 
        }

        res.status(200).json(response);
    
   } catch (error) {
    next(error);
   }
})


// PATCH Update user avatar (/api/users/me/avatar)

router.patch("/me/avatar", verifyToken, uploadAvatar.single("avatar"), 
    async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No avatar image provided." });
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.payload._id,
        { avatar: req.file.path }, // Direct path from Cloudinary
         {
            runValidators: true,
            new: true,
          },
      ).select("-password");

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found." });
      }

      res.status(200).json(updatedUser);
    } catch (error) {
      next(error);
    }
  }
);


// PATCH Change password (/api/users/me/change-password)
router.patch("/me/change-password", verifyToken, async (req, res, next) => {
  try {
    const userId = req.payload._id;
    const { currentPassword, newPassword } = req.body;

    // 1. Mandatory input guard clause
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ errorMessage: "Please provide both current and new passwords." });
    }

    // 2. Optional: New password strength validation
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        errorMessage: "New password must have at least 8 characters, one uppercase, one lowercase, and one number.",
      });
    }

    // 3. Fetch user from DB
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ errorMessage: "User not found." });
    }

    // 4. Verify current password matches existing hash
    const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ errorMessage: "Incorrect current password." });
    }

    // 5. Hash new password and save
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    next(error);
  }
});


// PATCH Update email (/api/users/me/change-email)
router.patch("/me/change-email", verifyToken, async (req, res, next) => {
    
    try {
        
        const userId = req.payload._id;
        const {email} = req.body 

        // Basic validation
        if (!email) {
        return res.status(400).json({ errorMessage: "Please provide a valid email." });
        }

        // Check if the email is already in use by another account
        const existingUser = await User.findOne({ email }); 
        if (existingUser && existingUser._id.toString() !== userId) {
        return res.status(400).json({ errorMessage: "This email is already in use." });
        }

        // Update the user's email
        const response = await User.findByIdAndUpdate(
            userId,
            {email},
            {
            runValidators: true,
            new: true,
          },
        ).select("-password"); // Excludes password hash from response

        if (!response){
           return res.status(404).json({ message: "User not found." }); 
        }

        res.status(200).json(response);
    
   } catch (error) {
    next(error);
   }
})


//DELETE  Delete account (/api/users/me)

router.delete("/me", verifyToken, async (req, res, next) => {
  try {
    const userId = req.payload._id;
    

    // 1. Pull user from viewers & editors lists across all shared profiles
    await MedicalProfile.updateMany(
      { viewers: userId },
      { $pull: { viewers: userId } }
    );
    await MedicalProfile.updateMany(
      { editors: userId },
      { $pull: { editors: userId } }
    );

    // 2. Delete profiles left with 0 editors
    const orphanedProfiles = await MedicalProfile.find({ editors: { $size: 0 } });
    const orphanedProfileIds = orphanedProfiles.map((p) => p._id);
   
    if (orphanedProfileIds.length > 0) {
      await MedicalProfile.deleteMany({ _id: { $in: orphanedProfileIds } });
    }

    // 3. Delete the user document
    const response = await User.findByIdAndDelete(userId);

    if (!response) {
      return res.status(404).json({ message: "User not found." });
    }
   
    res.status(200).json({ message: "User account and associated data successfully deleted." });
  } catch (error) {
    next(error);
  }
});




//export
module.exports = router 