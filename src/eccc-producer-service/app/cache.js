import Redis from "ioredis";
import { RedisMemoryServer } from "redis-memory-server";

const TTL_SECONDS = 24 * 60 * 60; // 24 hours
const server = new RedisMemoryServer();

const redis = new Redis(`redis://${await server.getHost()}:${await server.getPort()}`);
console.log("Initialized Redis at port: ", await server.getPort());

export async function cache(alertId) {
    return await redis.set(
        `eccc:alert:${alertId}`,
        Date.now(),
        "EX",
        TTL_SECONDS,
        "NX"
    ) === "OK";
}
