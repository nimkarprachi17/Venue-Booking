const mongoose = require('mongoose');

const FACILITIES = [
  'projector',
  'display',
  'ac',
  'microphone',
  'soundSystem',
  'paSystem',
  'stage',
  'podium',
  'whiteboard',
  'wifi',
  'computers',
  'videoConferencing',
  'accessible',
];

const VENUE_TYPES = ['classroom', 'seminarHall', 'auditorium', 'lab', 'other'];

const venueSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Venue name is required'],
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      enum: VENUE_TYPES,
      default: 'other',
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    facilities: {
      type: [{ type: String, trim: true }],
      default: [],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    imageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Venue', venueSchema);
module.exports.FACILITIES = FACILITIES;
module.exports.VENUE_TYPES = VENUE_TYPES;
