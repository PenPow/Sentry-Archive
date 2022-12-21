import { readFile } from "node:fs/promises";
import { default as IORedis } from "ioredis";
import type { Config } from "shared";
import { parse } from "toml";

export const RedisInstance = new IORedis.default("redis://redis:6379");

export const config: Config = parse(await readFile("config.toml", "utf8"));

if (
  !config.discord.TOKEN ||
  ![6, 7, 8, 9, 10].includes(config.proxy.API_VERSION)
) {
  throw new Error("Invalid Config");
}