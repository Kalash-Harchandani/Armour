/**
 * MongoDB Database Connection
 * Handles connection to MongoDB using Mongoose
 */

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/armour";

/**
 * Connect to MongoDB
 * @returns {Promise<void>}
 */
export async function connectDB() {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      // These options are recommended for Mongoose 6+
      // Remove useNewUrlParser and useUnifiedTopology as they're default in Mongoose 6+
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Disconnect from MongoDB
 * @returns {Promise<void>}
 */
export async function disconnectDB() {
  try {
    await mongoose.disconnect();
    console.log("✅ MongoDB Disconnected");
  } catch (error) {
    console.error(`❌ MongoDB disconnection error: ${error.message}`);
  }
}

// Handle connection events
mongoose.connection.on("disconnected", () => {
  console.log("⚠️  MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  console.error(`❌ MongoDB error: ${err.message}`);
});

export default mongoose;

