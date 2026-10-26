const nodemailer = require("nodemailer")
const dotenv = require("dotenv")
dotenv.config()
const APP_NAME = "Campus";   // change to "Book a Room" if you prefer
const OTP_EXPIRY_MINUTES = 5;
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    service: 'gmail',
    auth: {
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
            subject: "Verify your email | CampusSlot",
            html: `
    <div style="font-family: Arial, sans-serif;
                max-width: 480px; margin: auto;
                padding: 28px; border: 1px solid #e5e7eb;
                border-radius: 12px; color: #1f2937;">

      <h2 style="color: #173f35;">${APP_NAME}</h2>

      <h2>Verify your email address</h2>

      <p>Thanks for registering with ${APP_NAME}.
         Enter the OTP below to verify your email.</p>

      <div style="background: #f3f7f5; padding: 22px;
                  text-align: center; border-radius: 10px;">
        <p style="font-size: 12px; color: #6b7280;">
          YOUR VERIFICATION CODE
        </p>

        <h1 style="letter-spacing: 8px; color: #248568;">
          ${otp}
        </h1>

        <p>This code expires in ${OTP_EXPIRY_MINUTES} minutes.</p>
      </div>

      <p style="font-size: 13px; color: #6b7280;">
        Never share this code with anyone. If you didn't request it, ignore this email.
      </p>

      <hr style="border: 0; border-top: 1px solid #e5e7eb;">

      <p style="font-size: 12px; color: #9ca3af;
                text-align: center;">
        ${APP_NAME} · Automated email
      </p>
    </div>
  `
                
        }

        await transporter.sendMail(mailOptions);
        console.log(`OTP email sent to ${ email } for ${ type }`);
    } catch (error) {
        console.error("Error sending OTP email:", error)
    }
}

module.exports = sendOtpEmail;