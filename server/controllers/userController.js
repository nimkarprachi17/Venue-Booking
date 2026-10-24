const User = require('../models/User');

// PATCH /api/users/me   body: { name }
const updateMe = async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    if (name.length < 2) {
      return res.status(400).json({ message: 'Enter your full name' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name },
      { new: true, runValidators: true }
    );

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        authorizationStatus: user.isAuthorized ? 'approved' : 'pending',
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { updateMe };