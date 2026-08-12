import { createClient } from "redis";

export const connectRedis = async () => {
  const client = createClient({ url: process.env.REDIS_URL });
  client.on("error", (err) => console.error("Redis error:", err));
  await client.connect();
  console.log("  Redis connected");
  return client;
};
