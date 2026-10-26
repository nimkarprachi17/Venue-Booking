const mongoose=require("mongoose")

const otpSchema=new mongoose.Schema({
    email:{
        type:String,
        required:true,
    },
    otp:{
        type:String,
        required:true,
    },
    createdAt:{
        type:Date,
        expires:300   // 300 sec ke band ye doc(iska object)  db me se delete ho jayega
    }
});

module.exports = mongoose.model("OTP", otpSchema)