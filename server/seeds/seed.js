require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');
const Venue = require('../models/Venue');
const Booking = require('../models/Booking');
const AuthRequest = require('../models/AuthRequest');

const DEMO_PASSWORD = process.env.SEED_PASSWORD || 'Demo@1234';

// Role names must match the ROLES enum in models/User.js exactly.
// otpVerified is true so these demo users can log in without the email OTP step.
const users = [
  { name: 'Admin User', email: 'admin@college.edu', role: 'Admin', department: 'Administration', isAuthorized: true },
  { name: 'Faculty User', email: 'faculty@college.edu', role: 'Faculty', department: 'Computer Engineering', isAuthorized: true },
  { name: 'CR User', email: 'cr@college.edu', role: 'Class Representative', department: 'Computer Engineering', isAuthorized: true },
  { name: 'Club Head User', email: 'clubhead@college.edu', role: 'Club Head', department: 'Electronics', isAuthorized: true },
  { name: 'Unauthorized CR', email: 'newcr@college.edu', role: 'Class Representative', department: 'Mechanical', isAuthorized: false },
].map((u) => ({ ...u, otpVerified: true }));

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

// Tomorrow at the given hour, so seeded bookings are always in the future.
const tomorrowAt = (hour) => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hour, 0, 0, 0);
  return d;
};

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

  const byEmail = (email) => createdUsers.find((u) => u.email === email);
  const byName = (name) => createdVenues.find((v) => v.name === name);

  const admin = byEmail('admin@college.edu');
  const faculty = byEmail('faculty@college.edu');
  const cr = byEmail('cr@college.edu');
  const clubHead = byEmail('clubhead@college.edu');
  const newCr = byEmail('newcr@college.edu');

  await Booking.create([
    // Faculty bookings are confirmed instantly.
    {
      venue: byName('NC24')._id,
      bookedBy: faculty._id,
      eventName: 'Guest Lecture',
      eventType: 'lecture',
      expectedAttendance: 100,
      requiredFacilities: ['projector', 'microphone'],
      startTime: tomorrowAt(10),
      endTime: tomorrowAt(12),
      status: 'approved',
    },
    // CR booking waiting for admin approval.
    {
      venue: byName('NC05')._id,
      bookedBy: cr._id,
      eventName: 'Class Revision Session',
      eventType: 'class',
      expectedAttendance: 60,
      requiredFacilities: ['projector'],
      startTime: tomorrowAt(14),
      endTime: tomorrowAt(16),
      status: 'pending',
    },
    // Club Head booking that the admin rejected.
    {
      venue: byName('Main Auditorium')._id,
      bookedBy: clubHead._id,
      eventName: 'Club Showcase',
      eventType: 'event',
      expectedAttendance: 300,
      requiredFacilities: ['soundSystem', 'microphone'],
      startTime: tomorrowAt(16),
      endTime: tomorrowAt(18),
      status: 'rejected',
      rejectionReason: 'Auditorium reserved for a college event',
      reviewedBy: admin._id,
    },
  ]);

  // A pending authorization request for the unauthorized CR.
  await AuthRequest.create({
    user: newCr._id,
    type: 'Class Representative',
    details: { name: 'ME Third Year', department: 'Mechanical' },
  });

  console.log(
    `Seeded ${createdUsers.length} users, ${createdVenues.length} venues, 3 bookings and 1 auth request`
  );
  console.log(`Demo password for all users: ${DEMO_PASSWORD}`);
  await mongoose.connection.close();
};

seed().catch((error) => {
  console.error(`Seeding failed: ${error.message}`);
  process.exit(1);
});