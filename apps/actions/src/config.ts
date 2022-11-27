import { readFile } from "node:fs/promises";
import { RPCRedisBroker } from "@discordjs/brokers";
import { REST as RestClient } from '@discordjs/rest';
import { default as IORedis } from "ioredis";
import type { Config } from "shared";
import { parse } from "toml";
import { Logger } from "tslog";

export const config: Config = parse(await readFile("config.toml", "utf8"));

export const logger = new Logger();

export const REST = new RestClient({
    version: "10",
    api: "http://rest:3000/api",
}).setToken(config.discord.TOKEN);

const Redis = new IORedis.default("redis://redis:6379");
export const Broker = new RPCRedisBroker({ redisClient: Redis });