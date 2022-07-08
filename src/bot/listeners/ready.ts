import { on } from "events";
import { Events } from "discord.js";
import { log, LogLevel } from "../../common/logger.js";
import type { IListener } from "../structures/Listener.js";

const readyEvent: IListener = {
	event: Events.ClientReady,
	execute: async function(client) {
		for await (const [] of on(client, this.event) as AsyncIterableIterator<[void]>) {
			log({ prefix: 'Ready', level: LogLevel.Success }, "Client is Ready");
		}
	}
};

export default readyEvent;
