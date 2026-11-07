require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require("./routes/auth.routes");
const venueRoutes = require('./routes/venueRoutes');
const adminRoutes = require("./routes/admin.routes");
const userRoutes = require("./routes/user.routes");
const bookingRoutes = require("./routes/bookingRoutes");

const app = express();
const cookieParser = require("cookie-parser");

const allowedOrigins = [
  'http://localhost:5173',
  'https://venue-booking-phi.vercel.app',
  'https://venue-booking-db2wo1rs3-sinister4.vercel.app',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Venue Booking API is running');
});

// Serverless instances must finish connecting before database-backed routes run.
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Database is temporarily unavailable. Please try again shortly.',
    });
  }
});

app.use('/api/venues', venueRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/bookings", bookingRoutes);

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
