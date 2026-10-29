const express = require('express');
const AuthRequest = require('../models/AuthRequest');
const User = require('../models/User');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

router.use(requireAdmin);

router.get('/', async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const allowedStatuses = ['pending', 'approved', 'rejected'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid authorization request status' });
    }

    const requests = await AuthRequest.find({ status })
      .populate('user', 'name email role department')
      .sort({ createdAt: -1 });

    return res.json({ requests });
  } catch (error) {
    console.error('Unable to load authorization requests:', error);
    return res.status(500).json({ message: 'Unable to load authorization requests' });
  }
});

router.patch('/:id/:action', async (req, res) => {
  const { id, action } = req.params;

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ message: 'Action must be approve or reject' });
  }

  const rejectionReason = String(req.body.reason || '').trim();
  if (action === 'reject' && !rejectionReason) {
    return res.status(400).json({ message: 'A rejection reason is required' });
  }

  try {
    const request = await AuthRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Authorization request not found' });
    }
    if (request.status !== 'pending') {
      return res.status(409).json({ message: 'This request has already been reviewed' });
    }

    request.status = action === 'approve' ? 'approved' : 'rejected';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.rejectionReason = action === 'reject' ? rejectionReason : undefined;
    await request.save();

    if (action === 'approve') {
      await User.findByIdAndUpdate(request.user, { isAuthorized: true });
    }

    const updatedRequest = await AuthRequest.findById(request._id).populate(
      'user',
      'name email role department',
    );

    return res.json({ request: updatedRequest });
  } catch (error) {
    console.error('Unable to review authorization request:', error);
    return res.status(500).json({ message: 'Unable to review authorization request' });
  }
});

module.exports = router;
