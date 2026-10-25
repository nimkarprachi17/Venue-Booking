const express=require("express")
const router=express.Router()
const authMiddleware=require("../middleware/auth.middleware")
const adminMiddleware=require("../middleware/admin.middleware")
const adminController=require("../controllers/admin.controller")

router.get("/auth-requests",authMiddleware,adminMiddleware, adminController.getall)
router.patch("/auth-requests/:id/:action",authMiddleware,adminMiddleware, adminController.admin_decision)


module.exports=router