const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const groupDiscountRoutes = require('../routes/groupDiscount');

// Connect to the database
connectDB();

// Initialize express app
const app = express();

// Get the port from environment variables or use 5000
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/group-discount', groupDiscountRoutes);

// A simple test route
app.get('/', (req, res) => {
  res.send('API is running successfully!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});