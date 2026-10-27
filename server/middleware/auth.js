const jwt = require('jsonwebtoken');
const User = require('../models/User');

const getToken = (req) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' && token ? token : null;
};

// Requires a valid access token. Sets req.user.
const requireAuth = async (req, res, next) => {
  const token = getToken(req);
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  try {
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(payload.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Sets req.user if a valid token is sent, but lets everyone through.
const optionalAuth = async (req, res, next) => {
  const token = getToken(req);
  if (!token) return next();
  try {
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = await User.findById(payload.id).select('-passwordHash');
  } catch (err) {
    // an invalid token is treated as no token
  }
  next();
};

// Use after requireAuth: requireRole('admin')
const requireRole = (...roles) => (req, res, next) => {
  const allowed = roles.map((r) => r.toLowerCase());
  const current = String(req.user?.role || '').toLowerCase();
  if (!allowed.includes(current)) {
    return res.status(403).json({ message: 'You do not have permission to do this' });
  }
  next();
};

module.exports = { requireAuth, optionalAuth, requireRole };