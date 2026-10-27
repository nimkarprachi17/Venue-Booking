const userModel=require("../models/User")
const authRequestModel=require("../models/AuthRequest")
const mongoose=require("mongoose")

const getall=async(req,res)=>{
    try{
        const required_status=req.query.status   //which type of data according to status want
        const requests=await authRequestModel
                    .find({status:required_status})
                    .sort({createdAt:-1})

        return res.status(200).json({
            requests,
            message:"Data according to status sent",
            success:true
        })

    } catch(error){
        console.log("getAll me error")
        console.error("getAll me error",error)
        return res.status(400).json({
            message:"Internal server Error",
            success:false
        })
    }
}

const admin_decision=async(req,res)=>{
    try{
        const {id,action}=req.params  //id is of authrequest
        // const reason=req.body.reason?.trim()
        if (action === "approve") {
            const user1 = await authRequestModel.findByIdAndUpdate(id, { status: "approved", reviewedAt: new Date() }, {
                returnDocument: "after",
                runValidators: true
            }).sort({ createdAt: -1 })

            const user2 = await userModel.findByIdAndUpdate(user1.user, { isAuthorized: true }, {
                returnDocument: "after",
                runValidators: true
            }).select("-passwordHash")

            // const user2=await authRequestModel.findByIdAndUpdate({id}, {status:"approved" })
            
           
            return res.status(200).json({
                message:"User profile Approved",
                success:true,
                requests: {
                    name: user1.details.name,
                    status: user1.status,
                    type: user1.type,
                    rejectionReason: user1.rejectionReason,
                    // createdAt: user1.createdAt,
                }
            })
        }
        else{
            const reason=req.body.reason?.trim()
            if(!reason){
                return res.status(500).json({
                    message:"rejection Reason is required",
                    success:false
                })
            }
            const user=await authRequestModel.findOneAndUpdate({_id:id, status:"pending"}, {rejectionReason:reason, status:"rejected",reviewedAt:new Date()}, {
                returnDocument: "after",
                runValidators: true
            })

            if(!user){
                return res.status(404).json({
                    message:"Request not found or already reviewed.",
                    success:false
                })
            }
            return res.status(200).json({
                message:"User profile rejected",
                user
            })
        }
        
    }
    catch(error){
        console.log("Admin Decision failed:")
        console.error("Admin Decision failed:", error)
        return res.status(500).json({
            success:false,
            message:"Internal server error"
        })
    }
}


module.exports={getall,admin_decision}