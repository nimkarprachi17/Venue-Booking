const express = require('express');
const {
  createBooking,
  getBookings,
  getCalendarBookings,
  approveBooking,
  rejectBooking,
  cancelBooking,
} = require('../controllers/bookingController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/calendar', getCalendarBookings);
router.use(requireAuth);

router.get('/', getBookings);
router.post('/', createBooking);

router.patch('/:id/approve', requireRole('admin'), approveBooking);
router.patch('/:id/reject', requireRole('admin'), rejectBooking);
router.patch('/:id/cancel', cancelBooking);

module.exports = router;
