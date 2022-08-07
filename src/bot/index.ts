import 'source-map-support/register.js';

import * as Sentry from "@sentry/node";
import { ActivityType, Client, GatewayIntentBits, Partials } from "discord.js";
import { ListenerManager } from "./managers/ListenerManager.js";
import { DEVELOPMENT, DISCORD_TOKEN } from "../common/config.js";

import "@sentry/tracing";

export const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildBans],
	allowedMentions: { parse: [], repliedUser: false },
	failIfNotExists: false,
	partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember],
	presence: { status: "dnd", activities: [{ name: "for scammers", type: ActivityType.Watching }] },
});

await ListenerManager.loadEvents(client);

await client.login(DISCORD_TOKEN);

Sentry.init({
	dsn: process.env.SENTRY_DSN,
	environment: DEVELOPMENT ? "development" : "production",
	release: process.env.SENTRY_RELEASE ?? "unknown",
	tracesSampleRate: 1.0,
});
