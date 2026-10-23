const jwt=require("jsonwebtoken")
const userModel=require("../models/User")
const authMiddleware=async(req,res,next)=>{
    const token=req.headers.authorization
    if(!token || !token.startsWith("Bearer ")){
        return res.status(401).json({
            message:"Token is missing"
        })
    }
    try{
        const accessToken=token.split(" ")[1];
        const compare=jwt.verify(accessToken,process.env.ACCESS_TOKEN_SECRET)  //returns payload
    } catch(error){
        return res.status(401).json({
            success:false,
            message:"Invalid or expired token"
        })
    }

    try {
        const user = await userModel.findById(compare.id)   //session refresh on 401 status code
        if (!user || !user.isAuthorized) {
            return res.status(401).json({
                message: "Account not authorized",
                success: false
            })
        }
        req.user = user
        next()
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

module.exports=authMiddleware

