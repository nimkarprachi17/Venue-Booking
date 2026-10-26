require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');
const Venue = require('../models/Venue');
const Booking = require('../models/Booking');
const AuthRequest = require('../models/AuthRequest');

const DEMO_PASSWORD = process.env.SEED_PASSWORD || 'Demo@1234';

const users = [
  { name: 'Admin User', email: 'admin@college.edu', role: 'admin', department: 'Administration', isAuthorized: true },
  { name: 'Faculty User', email: 'faculty@college.edu', role: 'faculty', department: 'Computer Engineering', isAuthorized: true },
  { name: 'CR User', email: 'cr@college.edu', role: 'cr', department: 'Computer Engineering', isAuthorized: true },
  { name: 'Club Head User', email: 'clubhead@college.edu', role: 'clubHead', department: 'Electronics', isAuthorized: true },
  { name: 'Unauthorized CR', email: 'newcr@college.edu', role: 'cr', department: 'Mechanical', isAuthorized: false },
];

const venues = [
  { name: 'NC01', type: 'classroom', capacity: 60, facilities: ['projector', 'whiteboard'], location: 'Academics Complex (old name: AC 101)' },
  { name: 'NC05', type: 'classroom', capacity: 80, facilities: ['projector', 'ac', 'whiteboard'], location: 'Academics Complex (old name: AC 201)' },
  { name: 'NC13', type: 'classroom', capacity: 100, facilities: ['projector', 'ac'], location: 'Academics Complex (old name: AC 4th Floor)' },
  { name: 'SC01', type: 'classroom', capacity: 50, facilities: ['projector', 'whiteboard'], location: 'Old name: EE101' },
  { name: 'ND01', type: 'other', capacity: 60, facilities: ['whiteboard'], location: 'Old name: Mech Drawing Hall' },
  { name: 'NC24', type: 'seminarHall', capacity: 150, facilities: ['projector', 'ac', 'microphone', 'podium', 'wifi'], location: 'Old name: Seminar Hall-1' },
  { name: 'NT11', type: 'seminarHall', capacity: 120, facilities: ['projector', 'ac', 'microphone', 'podium'], location: 'Old name: Seminar Hall-2' },
  { name: 'Main Auditorium', type: 'auditorium', capacity: 500, facilities: ['projector', 'ac', 'microphone', 'soundSystem', 'podium'], location: 'Central Block' },
];

const seed = async () => {
  await connectDB();

  await Promise.all([
    User.deleteMany({}),
    Venue.deleteMany({}),
    Booking.deleteMany({}),
    AuthRequest.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const createdUsers = await User.insertMany(users.map((u) => ({ ...u, passwordHash })));
  const createdVenues = await Venue.insertMany(venues);

  const faculty = createdUsers.find((u) => u.role === 'faculty');
  const hall = createdVenues.find((v) => v.name === 'NC24');

  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(10, 0, 0, 0);
  const end = new Date(start);
  end.setHours(12, 0, 0, 0);

  await Booking.create({
    venue: hall._id,
    bookedBy: faculty._id,
    eventName: 'Guest Lecture',
    eventType: 'lecture',
    expectedAttendance: 100,
    requiredFacilities: ['projector', 'microphone'],
    startTime: start,
    endTime: end,
    status: 'approved',
  });

  console.log(`Seeded ${createdUsers.length} users, ${createdVenues.length} venues and 1 booking`);
  await mongoose.connection.close();
};

seed().catch((error) => {
  console.error(`Seeding failed: ${error.message}`);
  process.exit(1);
});