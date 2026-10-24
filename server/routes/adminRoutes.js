const express = require('express');
const {
  listAuthRequests,
  approveAuthRequest,
  rejectAuthRequest,
} = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole('admin'));

router.get('/auth-requests', listAuthRequests);
router.patch('/auth-requests/:id/approve', approveAuthRequest);
router.patch('/auth-requests/:id/reject', rejectAuthRequest);

module.exports = router;