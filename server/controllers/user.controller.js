const userModel=require("../models/User")
const authRequestModel=require("../models/AuthRequest")

const updateMe=async(req,res)=>{
    const updatedName=req.body.name
    const a=await userModel.findByIdAndUpdate(req.user.id, {name:updatedName}, {runValidators: true,returnDocument:aftter})
    await authRequestModel.findOneAndUpdate({email:req.user.email}, {"details.name" : updatedName}, {runValidators: true}).sort({createdAt:-1})

    return res.status(200).json({
        user:{
            name:a.name,
            email:a.email,
            role:a.role,
            id:a._id
        },
        message:"Profile updated",
        success:true
    })
}

module.exports={updateMe}