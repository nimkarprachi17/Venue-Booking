const jwt=require("jsonwebtoken")
const userModel=require("../models/User")
//Req related to  admin have to pass throught 2 middleware, authMiddleware -> Admin middleware
// in authmiddleware we are checking if it has token and match with secret or not
//in adminmiddleware we are checking role

const adminMiddleware=async(req,res,next)=>{
    const token =req.headers.authorization
    if(!token || !token.startsWith("Bearer ")){
        return res.status(401).json({
            message:"Token is missing"
        })
    }

    try{
        const accessToken=token.split(" ")[1]
        const payload=jwt.verify(accessToken,ACCESS_TOKEN_SECRET)
        const user=await userModel.findById(payload.id)   // we dont need to check ki user otp verified(otp and approved by admin) hai ya nahi
        if(!user || payload.role != user.role || user.role!== 'Admin'){   //bcoz wo allready auth middleware mese pass hua hai, so he has token ,which only gets when user "logins"
            return res.status(403).json({  //403 for non admin users
                message:"Unauthorized Access",
                success:false
            })
        }
        
        next()
    }catch(error){
        console.error("some error occured in admin middleware: ", error)
        return res.status(500).json({
            message:"Internal Server Error"
        })
    }
}

module.exports=adminMiddleware