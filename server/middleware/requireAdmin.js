const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;

async function requireAdmin(req, res, next) {
  const authorization = req.headers.authorization || '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Sign in to continue' });
  }

  try {
    const payload = jwt.verify(token, ACCESS_TOKEN_SECRET);
    const user = await User.findById(payload.id).select('_id role isAuthorized');

    if (!user || !user.isAuthorized) {
      return res.status(401).json({ message: 'Your session is no longer valid' });
    }

    if (user.role !== 'Admin') {
      return res.status(403).json({ message: 'Administrator access required' });
    }

    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired session' });
  }
}

module.exports = requireAdmin;
