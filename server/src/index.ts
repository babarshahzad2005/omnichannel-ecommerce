import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import { connectRedis } from "./config/redis";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/auth";
import { ApiError } from "./utils/ApiError";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);

app.use((req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
});

app.use(errorHandler);

const start = async () => {
  try {
    await connectDB();
    const redisClient = await connectRedis();
    app.locals.redis = redisClient;

    app.listen(PORT, () => {
      console.log(`\n  Server running on http://localhost:${PORT}`);
      console.log(`  Health check: http://localhost:${PORT}/api/health\n`);
    });
  } catch (err) {
    console.error("Failed to start:", err);
    process.exit(1);
  }
};

start();
