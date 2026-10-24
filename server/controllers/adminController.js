const AuthRequest = require('../models/AuthRequest');
const User = require('../models/User');

const STATUSES = ['pending', 'approved', 'rejected'];

const handleError = (res, error) => {
  if (error.name === 'CastError') {
    return res.status(400).json({ message: `Invalid value for ${error.path}` });
  }
  console.error(error);
  return res.status(500).json({ message: 'Server error' });
};

// GET /api/admin/auth-requests?status=pending|approved|rejected
const listAuthRequests = async (req, res) => {
  try {
    const { status } = req.query;
    if (status && !STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Status must be pending, approved or rejected' });
    }
    const filter = status ? { status } : {};
    const requests = await AuthRequest.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json({ requests });
  } catch (error) {
    handleError(res, error);
  }
};

const loadPendingRequest = async (req, res) => {
  const request = await AuthRequest.findById(req.params.id);
  if (!request) {
    res.status(404).json({ message: 'Authorization request not found' });
    return null;
  }
  if (request.status !== 'pending') {
    res.status(400).json({ message: `This request is already ${request.status}` });
    return null;
  }
  return request;
};

// PATCH /api/admin/auth-requests/:id/approve
const approveAuthRequest = async (req, res) => {
  try {
    const request = await loadPendingRequest(req, res);
    if (!request) return;

    request.status = 'approved';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();
    await User.findByIdAndUpdate(request.user, { isAuthorized: true });

    res.json({ request });
  } catch (error) {
    handleError(res, error);
  }
};

// PATCH /api/admin/auth-requests/:id/reject   body: { reason }
const rejectAuthRequest = async (req, res) => {
  try {
    const reason = String(req.body?.reason || '').trim();
    if (!reason) return res.status(400).json({ message: 'Enter a rejection reason' });

    const request = await loadPendingRequest(req, res);
    if (!request) return;

    request.status = 'rejected';
    request.rejectionReason = reason;
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    res.json({ request });
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = { listAuthRequests, approveAuthRequest, rejectAuthRequest };