import { PubSubRedisBroker, RPCRedisBroker } from "@discordjs/brokers";
import type { APIMessage } from "discord-api-types/v10";
import { logger } from "./config.js";
import { Redis } from "./db.js";

logger.debug("Preparing Brokers");

await Redis.config("SET", "replica-read-only", "no");

const PubSubBroker = new PubSubRedisBroker({ redisClient: Redis });
export const RPCBroker = new RPCRedisBroker({ redisClient: Redis });

logger.info("Connected Brokers to Redis");

RPCBroker.on('getCommands', ({ ack, reply }) => {
	void ack();

	return void reply();
});

await RPCBroker.subscribe('responders', ['getCommands']);

PubSubBroker.on("messages", ({ data, ack }) => {
  void ack();

  const message: APIMessage = data;
  logger.debug(`Recieved Message ${message.id}`);
});

await PubSubBroker.subscribe("subscribers", ["messages"]);
