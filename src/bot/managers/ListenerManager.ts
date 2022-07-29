import { readdir } from "fs/promises";
import { join } from "path";
import type { Client } from "discord.js";
import { log, LogLevel } from "../../common/logger.js";
import type { IListener } from "../structures/Listener.js";

export const ListenerManager = {
	loadEvents: async function(client: Client) {
		const files = await readdir(join(process.cwd(), "dist", "bot", "listeners")).catch(reason => log({ prefix: 'ListenerManager', level: LogLevel.Fatal }, reason as string));

		if (!files) return;

		for (const file of files) {
			if (['.disabled', '.d.ts', '.map'].some(suffix => file.endsWith(suffix))) continue;
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
			const event: IListener = (await import(join(process.cwd(), "dist", "bot", "listeners", file))).default;
			event.execute(client);
		}
	},
};
