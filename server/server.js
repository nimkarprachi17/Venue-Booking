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
connectDB();

app.use(cors({
  origin: process.env.CLIENT_URL || true,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Venue Booking API is running');
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
