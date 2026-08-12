import mongoose from "mongoose";

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI!;
  try {
    const conn = await mongoose.connect(uri);
    console.log(`  MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err;
  }
};
