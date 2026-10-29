const dns = require('node:dns');
const bcrypt = require('bcryptjs');
if (process.env.DNS_SERVERS) {
  dns.setServers(process.env.DNS_SERVERS.split(','));
}
const mongoose = require('mongoose');
const userModel = require('../models/User');

const ADMIN_EMAIL = 'admin@college.edu';

let isConnected = false;

const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState === 1) {
    return;
  }
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
    console.log(`MongoDB connected: ${conn.connection.host}`);

    // Create the default admin only if it does not exist yet.
    // $setOnInsert means an existing admin (and its password) is never overwritten.
    await userModel.findOneAndUpdate(
      { email: ADMIN_EMAIL },
      {
        $setOnInsert: {
          name: 'Admin',
          email: ADMIN_EMAIL,
          passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@12345', 10),
          role: 'Admin',
          isAuthorized: true,
          otpVerified: true,
        },
      },
      { upsert: true }
    );
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
