const router = require("express").Router();
const { verifyToken } = require("../middleware/auth.middleware.js")

// ℹ️ Organize and connect all your route files here.

const authRouter = require("./auth.routes.js")
router.use("/auth", authRouter)

const usersRouter = require("./users.routes");
router.use("/users", usersRouter);

const medicalProfileRouter = require("./medicalProfiles.routes.js");
router.use("/medical-profiles", medicalProfileRouter);

const documentsRouter = require("./documents.routes.js");
router.use("/documents", documentsRouter);


module.exports = router;
