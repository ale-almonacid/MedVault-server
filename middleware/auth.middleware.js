const jwt = require("jsonwebtoken")


function verifyToken(req, res, next){

    //extract the token 

    try {

        if (!req.headers.authorization){
            res.status(401).json({errorMessage: "Authorization token is required"})
            return
        }

        const token = req.headers.authorization.split(" ")[1]
    
        const payload = jwt.verify(token, process.env.TOKEN_SECRET)
        req.payload = payload // moving the payload info to the route, because WE WILL NEED IT. 
        
        next() // move to the next 
        
    } catch (error) {
        //if the token doesnt exist 
        // if the token is invalid 
        // if the token has expired 
        res.status(401).json({errorMessage: "Token doesnt exist or is not longer valid"})
    }

}

module.exports = {
    verifyToken
    //add here the other middlewares (like for roles later)
}