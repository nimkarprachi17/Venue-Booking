const express = require('express');
const {
  createVenue,
  getVenues,
  getVenueById,
  updateVenue,
  deactivateVenue,
} = require('../controllers/venueController');

const router = express.Router();

router.get('/', getVenues);
router.get('/:id', getVenueById);
router.post('/', createVenue);
router.patch('/:id', updateVenue);
router.patch('/:id/deactivate', deactivateVenue);

module.exports = router;