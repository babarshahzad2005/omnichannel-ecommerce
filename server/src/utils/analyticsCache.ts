import { createHash } from "crypto";
import { getRedis } from "../config/redis";

const ANALYTICS_CACHE_PREFIX = "analytics:";
const ANALYTICS_TTL_SECONDS = 5 * 60;

const buildCacheKey = (
  endpoint: string,
  params: Record<string, unknown>
): string => {
  const hash = createHash("sha256")
    .update(JSON.stringify(params))
    .digest("hex")
    .slice(0, 16);

  return `${ANALYTICS_CACHE_PREFIX}${endpoint}:${hash}`;
};

export const getAnalyticsCache = async <T>(
  endpoint: string,
  params: Record<string, unknown>
): Promise<T | null> => {
  const redis = getRedis();
  const key = buildCacheKey(endpoint, params);
  const cached = await redis.get(key);

  if (!cached) {
    return null;
  }

  return JSON.parse(cached) as T;
};

export const setAnalyticsCache = async (
  endpoint: string,
  params: Record<string, unknown>,
  data: unknown
): Promise<void> => {
  const redis = getRedis();
  const key = buildCacheKey(endpoint, params);

  await redis.setEx(key, ANALYTICS_TTL_SECONDS, JSON.stringify(data));
};

export const withAnalyticsCache = async <T>(
  endpoint: string,
  params: object,
  fetcher: () => Promise<T>
): Promise<T> => {
  const cacheParams = params as Record<string, unknown>;
  const cached = await getAnalyticsCache<T>(endpoint, cacheParams);

  if (cached) {
    return cached;
  }

  const result = await fetcher();
  await setAnalyticsCache(endpoint, cacheParams, result);

  return result;
};

export const invalidateAnalyticsCache = async (): Promise<void> => {
  const redis = getRedis();
  const keys = await redis.keys(`${ANALYTICS_CACHE_PREFIX}*`);

  if (keys.length > 0) {
    await redis.del(keys);
  }
};
