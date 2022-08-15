import { PunishmentType } from "@prisma/client";
import * as Sentry from "@sentry/node";
import { AuditLogEvent, ChannelType, EmbedBuilder, GuildBan } from "discord.js";
import { translate } from "../../common/translations/translate.js";
import { SettingsManager } from "../managers/SettingsManager.js";
import type { IListener } from "../structures/Listener.js";

const guildBanRemoveEvent: IListener = {
	execute: function(client) {
		client.on("guildBanRemove", async (ban: GuildBan) => {
			const logChannel = (await SettingsManager.getSettings(ban.guild.id)).logChannelId ? await ban.guild.channels.fetch((await SettingsManager.getSettings(ban.guild.id)).logChannelId!) : ban.guild.channels.cache.find(val => ["logs", "audit-logs", "server-logs", "sentry-logs", "guild-logs", "mod-logs", "modlogs"].includes(val.name));
			if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

			const auditLog = (await ban.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanRemove }).catch(e => void Sentry.captureException(e)))?.entries.first();

			if (!auditLog) return;

			if (auditLog.executor?.id === ban.client.user?.id) return;

			const embed = new EmbedBuilder()
				.setAuthor({ iconURL: auditLog.executor?.displayAvatarURL() ?? '', name: `${auditLog.executor?.tag ?? ''} (${auditLog.executor?.id ?? ''})` })
				.setTimestamp()
				.setColor(0x5CFF9D)
				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				.setDescription(translate(ban.guild.preferredLocale, "DISCORD_MODERATION_DESCRIPTION", ban, PunishmentType.Unban, translate(ban.guild.preferredLocale, "MODERATION_DEFAULT_REASON")))
				.setFooter({ text: translate(ban.guild.preferredLocale, "MANUAL_PUNISHMENT") });

			return void await logChannel.send({ embeds: [embed] }).catch(e => void Sentry.captureException(e));
		});
	}
};

export default guildBanRemoveEvent;
