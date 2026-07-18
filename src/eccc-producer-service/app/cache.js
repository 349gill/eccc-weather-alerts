import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
const KEY_PREFIX = "eccc:alert:";
const TTL_SECONDS = 24 * 60 * 60;

const redis = new Redis(REDIS_URL, {
  retryStrategy: (attempt) => Math.min(attempt * 200, 5000),
});

redis.on("error", (error) => console.error("redis:", error.message));

export async function claimAlert(alertId) {
  const claimed = await redis.set(
    KEY_PREFIX + alertId,
    Date.now(),
    "EX",
    TTL_SECONDS,
    "NX"
  );
  return claimed === "OK";
}

export async function releaseAlert(alertId) {
  await redis.del(KEY_PREFIX + alertId);
}

export function closeCache() {
  redis.disconnect();
}