import { ActivityType, Client, GatewayIntentBits } from "discord.js";
import { ListenerManager } from "./managers/ListenerManager.js";
import { DISCORD_TOKEN } from "../common/config.js";

export const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent],
	allowedMentions: { parse: [], repliedUser: false },
	failIfNotExists: false,
	presence: { status: "dnd", activities: [{ name: "for scammers", type: ActivityType.Watching }] },
});

export const managers = {
	listeners: ListenerManager
};

await managers.listeners.loadEvents(client);

await client.login(DISCORD_TOKEN);
