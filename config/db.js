const mongoose = require('mongoose');
 
// Load environment variables right away
require('dotenv').config({ path:'/Users/eppavishnuvardhanreddy/ shopify projects/apps/backend/.env' });

const connectDB = async () => {
  try {
    // Mongoose.connect returns a promise
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;