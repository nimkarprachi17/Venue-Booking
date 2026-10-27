const express = require('express');
const {
  createVenue,
  getVenues,
  getVenueById,
  updateVenue,
  deactivateVenue,
} = require('../controllers/venueController');
const { requireAuth, optionalAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Public, but admins are recognised so they can see inactive venues
router.get('/', optionalAuth, getVenues);
router.get('/:id', optionalAuth, getVenueById);

// Admin only
router.post('/', requireAuth, requireRole('admin'), createVenue);
router.patch('/:id', requireAuth, requireRole('admin'), updateVenue);
router.patch('/:id/deactivate', requireAuth, requireRole('admin'), deactivateVenue);

module.exports = router;