import { readdir } from "fs/promises";
import { join } from "path";
import { Client, Collection } from "discord.js";
import { log, LogLevel } from "../../common/logger.js";
import type { IListener } from "../structures/Listener.js";

export const ListenerManager = {
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
	events: new Collection() as Collection<string, IListener>,
	loadEvents: async function(client: Client) {
		const files = await readdir("/app/dist/bot/listeners").catch(reason => log({ prefix: 'ListenerManager', level: LogLevel.Fatal }, reason as string));

		if (!files) return;

		for (const file of files) {
			if (['.disabled', '.d.ts', '.map'].some(suffix => file.endsWith(suffix))) continue;

			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
			const event: IListener = (await import(join("/app/dist/bot/listeners", file))).default;

			this.events.set(event.event, event);
			event.execute(client);
		}
	},
	getEvent: function(name: string) { return this.events.get(name) ?? null; }
};
