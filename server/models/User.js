const mongoose = require('mongoose');

const ROLES = ['Faculty', 'Club Head', 'Class Representative', 'Admin'];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    role: {
      type: String,
      enum: ROLES,
      required: [true, 'Role is required'],
    },
    department: {
      type: String,
      trim: true,
    },
    position: { type: String, trim: true },
    year: { type: String, trim: true },
    branch: { type: String, trim: true },
    className: { type: String, trim: true },
    clubName: { type: String, trim: true },
    isAuthorized: {
      type: Boolean,
      default: false,
    },
    otpVerified:{
      type:Boolean,
      default:false,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
module.exports.ROLES = ROLES;
