const express=require("express")
const router=express.Router()
const userController=require("../controllers/user.controller")
const authMiddleware = require("../middleware/auth.middleware")

router.patch("/me",authMiddleware,userController.updateMe)


module.exports=router