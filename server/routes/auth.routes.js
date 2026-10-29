const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/auth.middleware.js");

router.post("/register", authController.userRegister);
router.post("/verify-otp", authController.otp_verify);
router.post("/resend-otp", authController.reSendOtp);
router.post("/cancel-registration", authController.cancelRegistration);
router.post("/login", authController.userLogin);
router.post("/logout", authController.logout);

router.post("/refresh", authController.refreshAccessToken);
//feature we can add- token blacklisting 

module.exports = router;
