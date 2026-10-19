const nodemailer = require("nodemailer")
const dotenv = require("dotenv")
dotenv.config()

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    service:'gmail',
    auth:{
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 30000
});

const sendOtpEmail = async (email, otp, type) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your OTP Code',
            text: `Your OTP Code is: ${otp}`
        }

        await transporter.sendMail(mailOptions);
        console.log(`OTP email sent to ${email} for ${type}`);
    } catch(error){
        console.error("Error sending OTP email:", error)
    }
}

module.exports=sendOtpEmail;