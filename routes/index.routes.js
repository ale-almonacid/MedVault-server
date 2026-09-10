const router = require("express").Router();
const { verifyToken } = require("../middleware/auth.middleware.js")

// ℹ️ Organize and connect all your route files here.

const authRouter = require("./auth.routes.js")
router.use("/auth", authRouter)

module.exports = router;
