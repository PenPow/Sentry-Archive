import "source-map-support/register.js";

import { readFile } from "node:fs/promises";
import { PubSubRedisBroker } from "@discordjs/brokers";
import { REST as RestClient } from "@discordjs/rest";
import { WebSocketManager, WebSocketShardEvents } from "@discordjs/ws";
import {
  GatewayDispatchEvents,
  GatewayIntentBits,
} from "discord-api-types/v10";
import type { Config } from "shared";
import { parse } from "toml";
import { Logger } from "tslog";
import { Redis } from "./db.js";

const config: Config = parse(await readFile("config.toml", "utf8"));

const logger = new Logger();

logger.debug("Connecting WS Proxy to Gateway");

const REST = new RestClient({
  version: "10",
  api: "http://rest:3000/api",
}).setToken(config.discord.TOKEN);
const manager = new WebSocketManager({
  intents: GatewayIntentBits.GuildMessages + GatewayIntentBits.MessageContent,
  token: config.discord.TOKEN,
  rest: REST,
});

logger.debug("Preparing Brokers");

await Redis.config("SET", "replica-read-only", "no");
const broker = new PubSubRedisBroker({ redisClient: Redis });

logger.info("Connected Brokers to Redis");

manager.on(WebSocketShardEvents.Dispatch, async ({ data }) => {
  if (data.t === GatewayDispatchEvents.Ready) {
    logger.info("Connected to Gateway");
  } else if (data.t === GatewayDispatchEvents.MessageCreate) {
    logger.debug(`Sending Message ${data.d.id}`);
    await broker.publish("messages", data.d);
  }
});

await manager.connect();
