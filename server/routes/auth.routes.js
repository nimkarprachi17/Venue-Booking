const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const authMiddleware=require("../middleware/auth.middleware.js")
// const adminController=require("../controllers/admin.controller") 

router.post("/register", authController.userRegister);
router.post("/verify-otp", authController.otp_verify);
router.post("/resend-otp", authController.reSendOtp);
router.post("/cancel-registration", authController.cancelRegistration);
router.post("/login", authController.userLogin);
// console.log("Middleware:", typeof Middleware.authMiddleware);
// console.log("Logout:", typeof authController.logout);
router.post("/logout",authController.logout)

router.post("/refresh", authController.refreshAccessToken)
//feature we can add- token blacklisting 

module.exports = router;