import express from "express";
import { createServer } from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db";
import { env } from "./config/env";
import { connectRedis } from "./config/redis";
import { initSocket } from "./config/socket";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/auth";
import categoryRoutes from "./routes/category";
import productRoutes from "./routes/product";
import inventoryRoutes from "./routes/inventory";
import cartRoutes from "./routes/cart";
import orderRoutes from "./routes/order";
import adminOrderRoutes from "./routes/admin/order";
import paymentRoutes from "./routes/payment";
import paymentWebhookRoutes from "./routes/payment.webhook";
import notificationRoutes from "./routes/notification";
import couponRoutes from "./routes/coupon";
import adminCouponRoutes from "./routes/admin/coupon";
import reviewRoutes from "./routes/review";
import adminReviewRoutes from "./routes/admin/review";
import adminAnalyticsRoutes from "./routes/admin/analytics";
import { ApiError } from "./utils/ApiError";
import { startCronJobs } from "./utils/stockCron";

const app = express();
const httpServer = createServer(app);

app.use(cors({
  origin: env.clientUrl,
  credentials: true
}));

app.use(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  paymentWebhookRoutes
);

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/admin/coupons", adminCouponRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin/reviews", adminReviewRoutes);
app.use("/api/admin/analytics", adminAnalyticsRoutes);

app.use((req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
});

app.use(errorHandler);

const start = async () => {
  try {
    await connectDB();
    const redisClient = await connectRedis();
    app.locals.redis = redisClient;
    startCronJobs();
    initSocket(httpServer);

    httpServer.listen(env.port, () => {
      console.log(`\n  Server running on http://localhost:${env.port}`);
      console.log(`  Health check: http://localhost:${env.port}/api/health`);
      console.log(`  Socket.io namespace: /orders\n`);
    });
  } catch (err) {
    console.error("Failed to start:", err);
    process.exit(1);
  }
};

start();
