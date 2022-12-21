import { default as IORedis } from "ioredis";

export const Redis = new IORedis.default("redis://redis:6379");
