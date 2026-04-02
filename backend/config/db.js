/**
 * =====================================================
 * Database Configuration Module
 * =====================================================
 * 
 * WHY: Centralizes MongoDB connection logic in one place.
 * This follows the DRY (Don't Repeat Yourself) principle.
 * 
 * EXPLANATION: 
 * - We use mongoose to create a connection to MongoDB
 * - Connection is established once when the server starts
 * - This module is imported in server.js
 * - Handles errors gracefully with proper logging
 */

const mongoose = require('mongoose');

/**
 * connectDB: Establishes connection to MongoDB database
 * 
 * WHEN CALLED:
 * - Once at server startup in server.js
 * 
 * HOW IT WORKS:
 * 1. Uses the MONGO_URI from environment variables
 * 2. Attempts to connect with options for stability
 * 3. Logs success or error messages
 * 4. Gracefully handles connection failures
 */
const connectDB = async () => {
  try {
    // Attempt connection to MongoDB using mongoose
    const connection = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,           // Use new URL parser
      useUnifiedTopology: true,       // Use new connection pooling engine
    });

    console.log(`✅ MongoDB Connected Successfully`);
    console.log(`   Host: ${connection.connection.host}`);
    return connection;

  } catch (error) {
    // If connection fails, log error and exit process
    console.error(`❌ MongoDB Connection Failed: ${error.message}`);
    process.exit(1);  // Exit with error code 1
  }
};

module.exports = connectDB;
