const mongoose = require('mongoose');

const BOOKING_STATUSES = ['pending', 'approved', 'rejected', 'cancelled'];

const bookingSchema = new mongoose.Schema(
  {
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue',
      required: [true, 'Venue is required'],
    },
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Booking owner is required'],
    },
    eventName: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
    },
    eventType: {
      type: String,
      trim: true,
    },
    expectedAttendance: {
      type: Number,
      required: [true, 'Expected attendance is required'],
      min: [1, 'Expected attendance must be at least 1'],
    },
    bookedFor: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    requiredFacilities: {
      type: [String],
      default: [],
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
      validate: {
        validator: function (value) {
          return value > this.startTime;
        },
        message: 'End time must be after start time',
      },
    },
    status: {
      type: String,
      enum: BOOKING_STATUSES,
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      trim: true,
      required: [
        function () {
          return this.status === 'rejected';
        },
        'A reason is required when a booking is rejected',
      ],
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

bookingSchema.index({ venue: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ bookedBy: 1, startTime: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
module.exports.BOOKING_STATUSES = BOOKING_STATUSES;