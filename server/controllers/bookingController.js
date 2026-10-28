const Booking = require('../models/Booking');
const Venue = require('../models/Venue');

// Campus time zone. Frontend sends "YYYY-MM-DD" and "HH:MM" with no zone,
// so we read and write them in this fixed offset (default India, +05:30).
const TZ_OFFSET = process.env.BOOKING_TZ_OFFSET || '+05:30';
const offsetMinutes = (() => {
  const m = /^([+-])(\d{2}):(\d{2})$/.exec(TZ_OFFSET);
  if (!m) return 330;
  return (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]));
})();

// Roles whose bookings are confirmed instantly. Everyone else needs admin approval.
const AUTO_APPROVE_ROLES = ['faculty', 'admin'];
// Roles that must be authorized by an admin before they can book.
const NEEDS_AUTHORIZATION_ROLES = ['class representative', 'club head'];

const FACILITY_ALIASES = {
  projector: 'projector',
  'video conferencing': 'videoConferencing',
  display: 'display',
  whiteboard: 'whiteboard',
  'wi-fi': 'wifi',
  wifi: 'wifi',
  ac: 'ac',
  microphone: 'microphone',
};

const handleError = (res, error) => {
  if (error.name === 'ValidationError') {
    const message = Object.values(error.errors)
      .map((e) => e.message)
      .join(', ');
    return res.status(400).json({ message });
  }
  if (error.name === 'CastError') {
    return res.status(400).json({ message: `Invalid value for ${error.path}` });
  }
  console.error(error);
  return res.status(500).json({ message: 'Server error' });
};

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseDateTime = (date, time) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !/^\d{2}:\d{2}$/.test(time || '')) return null;
  const parsed = new Date(`${date}T${time}:00${TZ_OFFSET}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toLocalParts = (value) => {
  const iso = new Date(new Date(value).getTime() + offsetMinutes * 60000).toISOString();
  return { date: iso.slice(0, 10), time: iso.slice(11, 16) };
};

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

// Shape the frontend's normalizeBooking() expects.
const toClient = (booking) => {
  const start = toLocalParts(booking.startTime);
  const end = toLocalParts(booking.endTime);
  // Approved with no reviewer means it was confirmed instantly.
  const status =
    booking.status === 'approved' && !booking.reviewedBy ? 'Confirmed' : capitalize(booking.status);
  return {
    bookingId: String(booking._id),
    event: booking.eventName,
    eventType: booking.eventType,
    description: booking.description,
    venue: booking.venue?.name,
    date: start.date,
    startTime: start.time,
    endTime: end.time,
    attendees: booking.expectedAttendance,
    facilities: booking.requiredFacilities,
    status,
    rejectionReason: booking.rejectionReason,
    bookedFor: booking.bookedFor,
    requestedBy: booking.bookedBy ? { name: booking.bookedBy.name, role: booking.bookedBy.role } : undefined,
    createdAt: booking.createdAt,
  };
};

const populateBooking = (query) =>
  query.populate('venue', 'name').populate('bookedBy', 'name role');

// Only approved bookings block a slot. Pending requests do not, so two people can
// request the same slot; the admin's approval re-checks and returns 409 for the second.
const findConflict = (venueId, startTime, endTime, excludeId) => {
  const filter = {
    venue: venueId,
    status: 'approved',
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };
  if (excludeId) filter._id = { $ne: excludeId };
  return Booking.findOne(filter);
};

const createBooking = async (req, res) => {
  try {
    const { event, eventType, description, venue, date, startTime, endTime, attendees, facilities, bookedFor } =
      req.body;
    const role = String(req.user.role || '').toLowerCase();

    if (NEEDS_AUTHORIZATION_ROLES.includes(role) && !req.user.isAuthorized) {
      return res.status(403).json({ message: 'Your account is not authorized to book venues yet' });
    }
    if (!event || !String(event).trim()) {
      return res.status(400).json({ message: 'Enter an event title' });
    }
    if (!venue) {
      return res.status(400).json({ message: 'Choose a venue' });
    }
    const attendeeCount = Number(attendees);
    if (!Number.isFinite(attendeeCount) || attendeeCount < 1) {
      return res.status(400).json({ message: 'Enter the number of attendees' });
    }

    const start = parseDateTime(date, startTime);
    const end = parseDateTime(date, endTime);
    if (!start || !end) {
      return res.status(400).json({ message: 'Enter a valid date, start time and end time' });
    }
    if (end <= start) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }
    if (start <= new Date()) {
      return res.status(400).json({ message: 'Booking must start in the future' });
    }

    const venueDoc = await Venue.findOne({
      name: new RegExp(`^${escapeRegex(String(venue).trim())}$`, 'i'),
      isActive: true,
    });
    if (!venueDoc) {
      return res.status(400).json({ message: `Venue "${venue}" was not found` });
    }
    if (attendeeCount > venueDoc.capacity) {
      return res.status(400).json({ message: `${venueDoc.name} fits up to ${venueDoc.capacity} people` });
    }

    const conflict = await findConflict(venueDoc._id, start, end);
    if (conflict) {
      return res.status(409).json({ message: `${venueDoc.name} is already booked for that time` });
    }

    const requiredFacilities = (Array.isArray(facilities) ? facilities : [])
      .map((f) => FACILITY_ALIASES[String(f).trim().toLowerCase()] || String(f).trim())
      .filter(Boolean);

    const booking = await Booking.create({
      venue: venueDoc._id,
      bookedBy: req.user._id,
      eventName: String(event).trim(),
      eventType,
      description,
      expectedAttendance: attendeeCount,
      requiredFacilities,
      startTime: start,
      endTime: end,
      bookedFor,
      status: AUTO_APPROVE_ROLES.includes(role) ? 'approved' : 'pending',
    });

    const saved = await populateBooking(Booking.findById(booking._id));
    res.status(201).json({ booking: toClient(saved) });
  } catch (error) {
    handleError(res, error);
  }
};

// Admins see every booking; everyone else sees their own.
const getBookings = async (req, res) => {
  try {
    const isAdmin = String(req.user.role || '').toLowerCase() === 'admin';
    const filter = isAdmin ? {} : { bookedBy: req.user._id };
    const bookings = await populateBooking(Booking.find(filter).sort({ startTime: -1 }));
    res.json({ bookings: bookings.map(toClient) });
  } catch (error) {
    handleError(res, error);
  }
};

const approveBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status !== 'pending') {
      return res.status(400).json({ message: `Only pending bookings can be approved (this one is ${booking.status})` });
    }

    // Re-check: another booking may have been approved for this slot since the request was made.
    const conflict = await findConflict(booking.venue, booking.startTime, booking.endTime, booking._id);
    if (conflict) {
      return res.status(409).json({ message: 'Another booking is already approved for this time. Reject this request instead.' });
    }

    booking.status = 'approved';
    booking.reviewedBy = req.user._id;
    await booking.save();
    res.json({ booking: toClient(await populateBooking(Booking.findById(booking._id))) });
  } catch (error) {
    handleError(res, error);
  }
};

const rejectBooking = async (req, res) => {
  try {
    const reason = String(req.body?.reason || '').trim();
    if (!reason) return res.status(400).json({ message: 'Enter a rejection reason' });

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status !== 'pending') {
      return res.status(400).json({ message: `Only pending bookings can be rejected (this one is ${booking.status})` });
    }

    booking.status = 'rejected';
    booking.rejectionReason = reason;
    booking.reviewedBy = req.user._id;
    await booking.save();
    res.json({ booking: toClient(await populateBooking(Booking.findById(booking._id))) });
  } catch (error) {
    handleError(res, error);
  }
};

// The person who made the booking, or an admin, can cancel it.
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const isAdmin = String(req.user.role || '').toLowerCase() === 'admin';
    const isOwner = String(booking.bookedBy) === String(req.user._id);
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'You do not have permission to cancel this booking' });
    }
    if (!['pending', 'approved'].includes(booking.status)) {
      return res.status(400).json({ message: `A ${booking.status} booking cannot be cancelled` });
    }

    booking.status = 'cancelled';
    await booking.save();
    res.json({ booking: toClient(await populateBooking(Booking.findById(booking._id))) });
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = { createBooking, getBookings, approveBooking, rejectBooking, cancelBooking, findConflict };
