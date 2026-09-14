const express = require("express")
const router = require("express").Router();

const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

const User = require("../models/User.model");
const { verifyToken } = require("../middleware/auth.middleware");

//routes 

//POST "/api/auth/signup" => receive user credentials and create the documents in the BD
router.post("/signup", async(req, res, next) =>{

    // test: console.log(req.body)
    const{email, password, username}= req.body // desctructuring

    //* server validators(mandatory)

    
    //email and password are required 
    if(!email || !password || !username ){
        res.status(400).json({errorMessage:"email and password and username are mandatory"})
        return // to make it a guard clause
    }
    
    //pasword strength
    let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/m
    if (passwordRegex.test(password) === false){
        res.status(400).json({errorMessage:"password is not strong enough. needs at least 8 characters, one uppercase, one lowercase and one number"})
        return // to make it a guard clause
    }
    
    try {
        //email should be unique 

        const foundUser = await User.findOne({ email:email }) //cleaner than just find 
        if (foundUser){
            res.status(400).json({errorMessage:"User already exists with this email"})
        return // to make it a guard clause
        }

        const hashedPassword = await bcrypt.hash(password, 12) // 12 rounds of salt (12-14) 

        await User.create({
            email: email,
            password: hashedPassword, // change password for the hashedpassword
            username: username
        })

        //we will create the document 
        res.sendStatus(201) // user was created (201 = created)
        
    } catch (error) {
        next(error)
    }


    //* optional
    //username could also be unique 
    //also username is required 
    //email exist
    //max lenght for strings properties (avoid users breaking)
    //email has a valid structure 


})

//POST "/api/auth/login" => validate user credentials and create the JWT
router.post("/login", async(req, res, next) =>{

    const{email, password}= req.body // desctructuring

    //* server validators(mandatory)

    //email and password are required
    if(!email || !password){
        res.status(400).json({errorMessage:"both email and password are mandatory"})
        return // to make it a guard clause
    }

    try {
        //email should belong to an existing user
        const foundUser = await User.findOne({ email:email })
        if (!foundUser){
            res.status(400).json({errorMessage:"User does not exist with this email"})
            return // to make it a guard clause
        }

        //password should match the stored hashed password
        const isPasswordCorrect = await bcrypt.compare(password, foundUser.password)
        if (!isPasswordCorrect){
            res.status(400).json({errorMessage:"Incorrect password"})
            return // to make it a guard clause
        }

        // continue here...

        const payload ={
            _id: foundUser._id,
            email: foundUser.email
            // if we have roles, we would need to add role of the user here 
        }

        const authToken = jwt.sign(payload, process.env.TOKEN_SECRET,{ // in .env defined
           expiresIn: "7d" 
        }) 

        res.status(200).json({ authToken, payload })

    } catch (error) {
        next(error)
    }
})




//GET "/api/auth/verify" => received the token, validates it 
//

router.get("/verify", verifyToken, (req, res)=>{
    res.status(200).json({ payload:req.payload })
})

module.exports = router 