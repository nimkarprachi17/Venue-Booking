require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes=require("./routes/auth.routes")
const venueRoutes = require('./routes/venueRoutes');

const app = express();
const cookieParser=require("cookie-parser")
connectDB();

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(cookieParser())
app.use(express.json());
app.use('/api/venues', venueRoutes);



// app.use(cookieParser())
app.get('/', (req, res) => {
  res.send('Venue Booking API is running');
});

app.use("/api/auth",authRoutes)
// app.use("/api/auth-requests", require("./routes/authRequest.routes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});