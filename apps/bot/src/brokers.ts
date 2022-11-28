import { PubSubRedisBroker, RPCRedisBroker } from "@discordjs/brokers";
import type { APIMessage } from "discord-api-types/v10";
import { logger } from "./config.js";
import { Redis } from "./db.js";
import { Commands, loadCommands } from "./structures/Command.js";

logger.debug("Preparing Brokers");

await Redis.config("SET", "replica-read-only", "no");

const PubSubBroker = new PubSubRedisBroker({ redisClient: Redis });
export const RPCBroker = new RPCRedisBroker({ redisClient: Redis });

logger.info("Connected Brokers to Redis");

RPCBroker.on('getCommands', async ({ ack, reply }) => {
	void ack();

	await loadCommands();

	return void reply([...Commands.values()].map((val) => val.toJSON()));
});

await RPCBroker.subscribe('responders', ['getCommands']);

PubSubBroker.on("messages", ({ data, ack }) => {
  void ack();

  const message: APIMessage = data;
  logger.debug(`Recieved Message ${message.id}`);
});

await PubSubBroker.subscribe("subscribers", ["messages"]);
