import type { Settings } from "@prisma/client";
import type { Snowflake } from "discord.js";
import { prisma } from "../../common/db.js";

export const SettingsManager = {
	getSettings: async function(guildId: Snowflake): Promise<Settings> {
		await prisma.guild.upsert({ create: { id: guildId, settings: {} }, update: {}, where: { id: guildId } });
		await prisma.settings.upsert({ create: { id: guildId }, update: {}, where: { id: guildId } });

		return (await prisma.guild.findUnique({ where: { id: guildId }, include: { settings: true } }))?.settings ?? { id: guildId, automod: true, phrase: true, username: true, invite: true, url: true, spam: true, clamav: true };
	},
	setSettings: async function(guildId: Snowflake, settings: Omit<Settings, 'id'>): Promise<Settings> {
		await prisma.guild.upsert({ create: { id: guildId, settings: {} }, update: {}, where: { id: guildId } });
		return prisma.settings.upsert({ create: { id: guildId, ...settings }, update: { ...settings }, where: { id: guildId } });
	}
};
