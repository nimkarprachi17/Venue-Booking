const mongoose = require('mongoose');

const AUTH_REQUEST_TYPES = ['Class Representative', 'Club Head','Faculty'];
const AUTH_REQUEST_STATUSES = ['pending', 'approved', 'rejected'];

const authRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    type: {
      type: String,
      enum: AUTH_REQUEST_TYPES,
      required: [true, 'Request type is required'],
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    details: {
      name: {
        type: String,
        required: [true, 'Class or club name is required'],
        trim: true,
      },
      department: {
        type: String,
        trim: true,
      },
      note: {
        type: String,
        trim: true,
      },
    },
    status: {
      type: String,
      enum: AUTH_REQUEST_STATUSES,
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default:""
    },
    expiresAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

authRequestSchema.index(
  { user: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } }
);
authRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('AuthRequest', authRequestSchema);
module.exports.AUTH_REQUEST_TYPES = AUTH_REQUEST_TYPES;
module.exports.AUTH_REQUEST_STATUSES = AUTH_REQUEST_STATUSES;