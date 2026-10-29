const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const userModel = require("../models/User")
const otpModel = require("../models/otp.model")
const sendOtpEmail = require("../email/email")
const authRequest = require("../models/AuthRequest")
const OTP_VALID_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

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
        const { fullName, email, role, password, position, year, branch, className, clubName } = req.body;
        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "Field is empty" });
        }

        const allowedRegistrationRoles = ["Faculty", "Class Representative", "Club Head"];
        if (!allowedRegistrationRoles.includes(role)) {
            return res.status(400).json({ message: "Choose a valid college role" });
        }

        const roleDetails = { position, year, branch, className, clubName };
        if (role === "Faculty" && !String(position || "").trim()) {
            return res.status(400).json({ message: "Enter your faculty position" });
        }
        if (role === "Class Representative" && [year, branch, className].some((value) => !String(value || "").trim())) {
            return res.status(400).json({ message: "Enter your year, branch, and class" });
        }
        if (role === "Club Head" && [clubName, position].some((value) => !String(value || "").trim())) {
            return res.status(400).json({ message: "Enter your club name and position" });
        }

        const { fullName, role, password } = req.body;
        const email=req.body.email?.trim().toLowerCase()

        //Validation
        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "Field is empty" });
        }
        if (!/.+@.+\..+/.test(email)) {
            return res.status(400).json({ message: "Enter a valid email address" });
        }
        if (password.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters" });
        }

        const existing = await userModel.findOne({ email });
        if (existing) {
            const requestmodel = await authRequest.findOne({user:existing._id }).sort({createdAt:-1});
            if (existing.otpVerified && existing.isAuthorized) {
                console.error(error)
                return res.status(400).json({ message: "User already exists. Please sign in." });
            }
            if (existing.otpVerified && requestmodel?.status == "pending") {
                return res.status(400).json({ message: "Your request is already awaiting admin approval." });
            }

            await authRequest.deleteMany({ user: existing._id });  //possibility ki like pehle user ne register kiya hoga but reject ho gaya
            await userModel.deleteOne({ _id:existing._id });   // and now firse register karne ka try kar raha hai
        }

        const hashed = await bcrypt.hash(password, 10);

        const user = await userModel.create({
            name: fullName,
            email,
            passwordHash: hashed,
            role,
            position: String(roleDetails.position || "").trim(),
            year: String(roleDetails.year || "").trim(),
            branch: String(roleDetails.branch || "").trim(),
            className: String(roleDetails.className || "").trim(),
            clubName: String(roleDetails.clubName || "").trim(),
            createdAt: new Date(),
        });

        await authRequest.create({
            user:user._id,
            email,
            type:role,
            details:{name:fullName},
            status:"pending",
        })

        await otpModel.deleteOne({ email });
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`OTP for ${email}: ${otp}`);
        const otphash = await bcrypt.hash(otp, 10);
        await otpModel.create({ email, otp: otphash });
        await sendOtpEmail(email, otp, 'account_verification');

        if (role !== "Faculty") {
            await authRequest.create({  //kyuki authRequest schema sirf cr ,club ke liye haii .
                user: user._id,
                type: role,
                details: role === "Class Representative"
                    ? {
                        name: String(className).trim(),
                        className: String(className).trim(),
                        year: String(year).trim(),
                        branch: String(branch).trim(),
                    }
                    : {
                        name: String(clubName).trim(),
                        clubName: String(clubName).trim(),
                        position: String(position).trim(),
                    },
                status: "pending",
            });
        }

        // if (role !== "Faculty") {
        //     await authRequest.create({  //kyuki authRequest schema sirf cr ,club ke liye haii .
        //         user: user._id,
        //         type: role,
        //         details: { name: fullName },
        //         status: "pending",
        //     });
        // }

        return res.status(200).json({
            message: "OTP sent successfully. Check email",
            email,
            id: user._id,
            resendAfterSeconds: 60
        });
    } catch (error) {
           console.error("Register error:", error);
        return res.status(400).json({
            error: error.message,
            message: "user registration failed"
        });
    }
};

const otp_verify = async (req, res) => {
    try {
        const { code } = req.body;
        const email=req.body.email.trim().toLowerCase()
        // const otpRecord = await otpModel.findOne({ email });
        if (!email || !/^\d{6}$/.test(code)) {
            return res.status(400).json({ message: "Enter the six-digit code sent to your email." });
        }

        const otpRecord = await otpModel.findOneAndUpdate(
            {email},
            {$inc :{attempts: 1}},
            {new :true}
        );
        if(!otpRecord) {
            return res.status(400).json({ message: "Invalid or Expired Otp" });
        }

        if (otpRecord.createdAt && Date.now() - otpRecord.createdAt.getTime() > OTP_VALID_MS) {
            await otpModel.deleteOne({ _id: otpRecord._id });
            return res.status(400).json({ message: "This code has expired. Please request a new one." });
        }

        if (otpRecord.attempts > MAX_ATTEMPTS) {
            await otpModel.deleteOne({ _id: otpRecord._id });
            return res.status(429).json({ message: "Too many incorrect attempts. Please request a new code." });
        }

        const isMatch = await bcrypt.compare(code, otpRecord.otp);
        if (!isMatch) {
            const remaining=MAX_ATTEMPTS-otpRecord.attempts;  //maxattempts=5
            if(remaining<=0){
                await otpModel.deleteOne({ _id: otpRecord._id });
                return res.status(429).json({ message: "Too many incorrect attempts. Please request a new code." });
            }
            return res.status(400).json({ email, message: `wrong code. ${remaining} attempt${remaining===1 ? "":"s"} remaining` });
        }

        const deleted=await otpModel.findOneAndDelete({ _id:otpRecord._id});
        

        const user = await userModel.findOneAndUpdate(
            {email},
            {otpVerified:true},
            {new:true}
        );
        // if (user.role === "Faculty") user.isAuthorized = true;
        // await user.save()
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }



        return res.status(200).json({
            message: "Email verified successfully",
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                authorizationStatus: authRequest.status == "approved" ? "approved" : "pending"
            }
        });
    } catch (error) {
        console.error("OTP verify error:", error)
        return res.status(500).json({ message: "Verification failed. Please try again", error: error.message });
    }
};

const reSendOtp = async (req, res) => {
    try {
        const email = req.body.email?.trim().toLowerCase();
        if(!email){
            return res.status(400).json({
                success:false,
                message:"email is required"
            })
        }
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
            email: email,
            resendAfterSeconds:60
        })
    } catch (error) {
        console.error("Resend OTP error:", error);
        return res.status(500).json({
            success: false,
            message: "Sending Otp failed",
        });
    }
}

const cancelRegistration = async (req, res) => {
    try {
        const email = req.body.email?.trim().toLowerCase()
        if (!email) {
            return res.status(400).json({
                message: "Email is required",
                success: false
            })
        }
        const user = await userModel.findOne({ email });
        if (user && !user.otpVerified) {
            await authRequest.deleteMany({ user: user._id });
            await userModel.deleteOne({ _id: user._id });
            await otpModel.deleteOne({ email });
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
    const email=req.body.email?.trim().toLowerCase()
    const password=req.body.password
    try {
        if (!email || !password) {    //validation user input 
            return res.status(400).json({
                success:false,
                message:"username and password are required"
            })
        }
       
        const user = await userModel.findOne({ email })   //find the user
        if (!user){
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            })
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);  //Verification 
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        if (!user.otpVerified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email before login",
            });
        }
       
        let authorizationStatus = "approved";
        if (!user.isAuthorized) {    
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
            message: authorizationStatus==="approved" ? "Login successful":"Account awaiting approval",
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
        const payload =jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
        if(!payload){
            res.clearCookie("refreshToken",refreshCookieOptions)
            return res.status(401).json({message:"Invalid or expired token"});
        }
        const user = await userModel.findOne({ _id: payload.id })

        if (!user || !user.isAuthorized || !user.otpVerified) {
            res.clearCookie("refreshToken",refreshCookieOptions)
            return res.status(401).json({
                message: "Session is not valid"
            })
        }
        const accessToken = jwt.sign({
            id: payload.id, role: user.role
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
