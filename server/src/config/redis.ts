import { createClient, type RedisClientType } from "redis";
import { env } from "./env";

let redisClient: RedisClientType | null = null;

export const connectRedis = async (): Promise<RedisClientType> => {
  if (redisClient) {
    return redisClient;
  }

  const client = createClient({ url: env.redisUrl });
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
