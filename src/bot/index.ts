import { ActivityType, Client, GatewayIntentBits, Partials } from "discord.js";
import { ListenerManager } from "./managers/ListenerManager.js";
import { DISCORD_TOKEN } from "../common/config.js";

export const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages],
	allowedMentions: { parse: [], repliedUser: false },
	failIfNotExists: false,
	partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember],
	presence: { status: "dnd", activities: [{ name: "for scammers", type: ActivityType.Watching }] },
});

export const managers = {
	listeners: ListenerManager,
};

await managers.listeners.loadEvents(client);

await client.login(DISCORD_TOKEN);
