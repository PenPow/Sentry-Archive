import { readFile } from "node:fs/promises";
import { default as IORedis } from "ioredis";
import type { Config } from 'shared';
import { parse } from "toml";
import { Logger } from "tslog";

export const config: Config = parse(await readFile("config.toml", "utf8"));
export const logger = new Logger();
export const Redis = new IORedis.default("redis://redis:6379");