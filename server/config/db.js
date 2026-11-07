const dns = require('node:dns');
const bcrypt = require('bcryptjs');
if (process.env.DNS_SERVERS) {
  dns.setServers(process.env.DNS_SERVERS.split(','));
}
const mongoose = require('mongoose');
const userModel = require('../models/User');

const ADMIN_EMAIL = 'admin@college.edu';
let connectionPromise;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (connectionPromise) return connectionPromise;
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not configured');
  }

  connectionPromise = mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  }).then(async (conn) => {
    console.log(`MongoDB connected: ${conn.connection.host}`);

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
    return conn.connection;
  }).catch((error) => {
    connectionPromise = undefined;
    console.error(`MongoDB connection failed: ${error.message}`);
    throw error;
  });

  return connectionPromise;
};

module.exports = connectDB;
