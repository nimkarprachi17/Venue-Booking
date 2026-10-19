const mongoose = require('mongoose');

const ROLES = ['faculty', 'cr', 'clubHead', 'admin'];

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
      select: false,
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
    isAuthorized: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
module.exports.ROLES = ROLES;