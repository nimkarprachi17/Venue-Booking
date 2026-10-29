const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const userModel = require("../models/User")
const otpModel = require("../models/otp.model")
const sendOtpEmail = require("../email/email")
const authRequest = require("../models/AuthRequest")

const refreshCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

//401 -> session refreshes i.e access token gets generated again  /api/auth/refresh
//register
const userRegister = async (req, res) => {
    try {
        const { fullName, email, role, password } = req.body;
        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "Field is empty" });
        }


        const existing = await userModel.findOne({ email });
        const requestmodel = await authRequest.findOne({ email });
        if (requestmodel) {
            if (requestmodel.status === "approved") {
                return res.status(400).json({
                    message: "User already Exist",
                    user: { id: existing._id, email: existing.email }
                });
            }
            await authRequest.deleteMany({ user: existing._id });  //possibility ki like pehle user ne register kiya hoga but reject ho gaya
            await userModel.findOneAndDelete({ email });   // and now firse register karne ka try kar raha hai
        }

        const hashed = await bcrypt.hash(password, 10);

        const user = await userModel.create({
            name: fullName,
            email,
            passwordHash: hashed,
            role,
            createdAt: new Date(),
        });

        await otpModel.findOneAndDelete({ email });
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`OTP for ${email}: ${otp}`);
        const otphash = await bcrypt.hash(otp, 10);
        await otpModel.create({ email, otp: otphash });
        await sendOtpEmail(email, otp, 'account_verification');

        if (role !== "Faculty") {
            await authRequest.create({  //kyuki authRequest schema sirf cr ,club ke liye haii .
                user: user._id,
                type: role,
                details: { name: fullName },
                status: "pending",
            });
        }

        return res.status(200).json({
            message: "OTP sent successfully. Check email",
            email,
            id: user._id,
            resendAfterSeconds: 60
        });
    } catch (error) {
        return res.status(400).json({
            error: error.message,
            message: "user registration failed"
        });
    }
};

const otp_verify = async (req, res) => {
    try {
        const { email, code } = req.body;
        const otpRecord = await otpModel.findOne({ email });
        if (!otpRecord) {
            return res.status(400).json({ message: "Invalid or Expired Otp" });
        }

        const isMatch = await bcrypt.compare(code, otpRecord.otp);
        if (!isMatch) {
            return res.status(400).json({ email, message: "Invalid or Wrong OTP" });
        }

        await otpModel.findOneAndDelete({ email });

        const user = await userModel.findOneAndUpdate(
            { email },
            { otpVerified: true },
            { new: true }
        );
        // if (user.role === "Faculty") user.isAuthorized = true;
        // await user.save()
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.role === "Faculty") {
            user.isAuthorized = true;
            await authRequest.findOneAndUpdate({ email }, { status: "approved" })
        }
        await user.save()

        return res.status(200).json({
            message: "Otp Verification Successfull",
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                authorizationStatus: authRequest.status == "approved" ? "approved" : "pending"
            }
        });
    } catch (error) {
        return res.status(500).json({ message: "Verification failed", error: error.message });
    }
};

const reSendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        await otpModel.findOneAndDelete({ email })
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`OTP for ${email}: ${otp}`);
        const otpsalt = await bcrypt.genSalt(10);
        const otphash = await bcrypt.hash(otp, otpsalt);
        await otpModel.create({ email, otp: otphash });
        await sendOtpEmail(email, otp, 'account_verification');

        return res.status(200).json({
            success: true,
            message: "resent Otp  successfully",
            email: email
        })
    } catch (error) {
        console.error("Resend OTP error:", error);
        return res.status(400).json({
            success: false,
            message: "Sending Otp failed",
            email
        });
    }
}

const cancelRegistration = async (req, res) => {
    try {
        const { email } = req.body
        if (!email) {
            return res.status(400).json({
                message: "Emsil is required",
                success: false
            })
        }
        const user = await userModel.findOne({ email });
        if (user && !user.otpVerified) {
            await authRequest.deleteMany({ user: user._id });
            await userModel.findOneAndDelete({ _id: user._id });
        }


        return res.status(200).json({
            success: true,
            message: "Registration cancelled successfully"
        });
    } catch (error) {
        console.error("Cancel registration error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to cancel registration"
        })
    }
}


const userLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {    //validation user input 
            return res.status(400).json({
                success: false,
                message: "Username or Password is required"
            })
        }
        //  const nemail=email=email.trim().toLowerCase();  //trim- removes extra space from beginning and ending
        const user = await userModel.findOne({ email })   //find the user
        if (!user || !user.passwordHash) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password",
            })
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);  //Verification 
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        if (!user.otpVerified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email before signing in",
            });
        }
        // const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        // if (!isPasswordValid) {
        //     return res.status(400).json({
        //         success: false,
        //         message: "Invalid email or password",
        //     });
        // }

        let authorizationStatus = "approved";
        if (!user.isAuthorized) {    //yaha pe authRequest.status != "accepted" bhi chha jaata
            const request = await authRequest.findOne({ user: user._id }).sort({ createdAt: -1 });
            authorizationStatus = request?.status === "rejected" ? "rejected" : "pending";
        }

        let accessToken = null;
        if (authorizationStatus === "approved") {
            accessToken = jwt.sign(
                { id: user._id, role: user.role },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '15m' }
            )

            const refreshToken = jwt.sign(
                { id: user._id, role: user.role },
                process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: '7d' }
            )

            res.cookie("refreshToken", refreshToken, refreshCookieOptions)
        }
        req.user = {
            name: user.name,
            role: user.role,
            email: user.email,
            id: user._id
        }

        return res.status(200).json({
            success: true,
            message: authorizationStatus === "approved" ? "Login successful" : "Account awaiting approval",
            user: {
                name: user.name,
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                authorizationStatus,
            },
            accessToken
        });

    } catch (error) {
        console.error("Login error:", error);
        console.log("Login me error")
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

const refreshAccessToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken
        if (!refreshToken) {
            return res.status(401).json({
                message: "No session"
            })
        }
        const payload = await jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await userModel.findOne({ _id: payload.id })

        if (!user || !user.isAuthorized || !user.otpVerified) {
            res.clearCookie("refreshToken", { path: "/api/auth" })
            return res.status(401).json({
                message: "Session is not valid"
            })
        }
        const accessToken = jwt.sign({
            id: payload.id, role: payload.role
        }, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: "15m"
        })

        res.cookie("refreshToken", jwt.sign({ id: user._id, role: user.role }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" }), refreshCookieOptions)

        return res.status(200).json({
            accessToken: accessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                name: user.name,
                role: user.role,
                authorizationStatus: "approved"
            }
        })
    }
    catch (error) {
        console.error("refresh access token generation failed", error)
        res.clearCookie("refreshToken", { path: "/api/auth" })
        return res.status(401).json({ message: "Invalid or expired Token" })
    }
}

const logout = (req, res) => {
    try {
        res.clearCookie("refreshToken", refreshCookieOptions)
        return res.status(200).json({ message: "Logout Successful", success: true })
    }
    catch (error) {
        console.error("Logout failed", error)
        return res.status(400).json({
            message: "Logout failed"
        })
    }
}

module.exports = { userRegister, reSendOtp, userLogin, cancelRegistration, otp_verify, refreshAccessToken, logout }