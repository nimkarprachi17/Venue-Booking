const dns = require('node:dns');
const bcrypt=require("bcryptjs")
if (process.env.DNS_SERVERS) {
  dns.setServers(process.env.DNS_SERVERS.split(','));
}
const mongoose = require('mongoose');
const userModel=require("../models/User")
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    await userModel.findOneAndUpdate(
      { email: "admin@college.edu" },
      {
        name: "Admin",
        email: "admin@college.edu",
        passwordHash: await bcrypt.hash("Admin@12345", 10),
        role: "Admin",
        isAuthorized: true,
        otpVerified: true,
      },
      { upsert: true }
    );




  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;