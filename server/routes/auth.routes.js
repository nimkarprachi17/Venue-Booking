const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

router.post("/register", authController.userRegister);
router.post("/verify-otp", authController.otp_verify);
router.post("/resend-otp", authController.reSendOtp);
router.post("/cancel-registration", authController.cancelRegistration);
router.post("/login", authController.userLogin);

module.exports = router;