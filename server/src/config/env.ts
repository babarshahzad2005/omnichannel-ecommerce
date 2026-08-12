import dotenv from "dotenv";

dotenv.config();

const REQUIRED_ENV_VARS = [
  "PORT",
  "MONGODB_URI",
  "REDIS_URL",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "CLIENT_URL",
] as const;

function validateEnv(): void {
  const missing = REQUIRED_ENV_VARS.filter(
    (key) => !process.env[key]?.trim()
  );

  if (missing.length > 0) {
    console.error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
    process.exit(1);
  }

  const port = Number(process.env.PORT);

  if (!Number.isFinite(port) || port <= 0) {
    console.error("PORT must be a positive number");
    process.exit(1);
  }
}

validateEnv();

export const env = {
  port: Number(process.env.PORT),
  mongodbUri: process.env.MONGODB_URI as string,
  redisUrl: process.env.REDIS_URL as string,
  jwtSecret: process.env.JWT_SECRET as string,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET as string,
  clientUrl: process.env.CLIENT_URL as string,
  nodeEnv: process.env.NODE_ENV ?? "development",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
} satisfies Record<string, string | number | undefined>;

export type Env = typeof env;
