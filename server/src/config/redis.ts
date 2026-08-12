import { createClient, type RedisClientType } from "redis";

let redisClient: RedisClientType | null = null;

export const connectRedis = async (): Promise<RedisClientType> => {
  if (redisClient) {
    return redisClient;
  }

  const client = createClient({ url: process.env.REDIS_URL });
  client.on("error", (err) => console.error("Redis error:", err));
  await client.connect();
  console.log("  Redis connected");
  redisClient = client;
  return client;
};

export const getRedis = (): RedisClientType => {
  if (!redisClient) {
    throw new Error("Redis client is not connected");
  }

  return redisClient;
};
