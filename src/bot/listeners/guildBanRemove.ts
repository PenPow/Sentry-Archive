import { AuditLogEvent, ChannelType, EmbedBuilder, GuildBan } from "discord.js";
import { translate } from "../../common/translations/translate.js";
import type { IListener } from "../structures/Listener.js";

const guildBanRemoveEvent: IListener = {
	execute: function(client) {
		client.on("guildBanRemove", async (ban: GuildBan) => {
			const logChannel = ban.guild.channels.cache.find(val => ["logs", "audit-logs", "server-logs", "sentry-logs", "guild-logs", "mod-logs", "modlogs"].includes(val.name));
			if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

			const auditLog = (await ban.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanRemove }).catch()).entries.first();

			if (!auditLog) return;

			if (auditLog.executor?.id === ban.client.user?.id) return;

			const embed = new EmbedBuilder()
				.setAuthor({ iconURL: auditLog.executor?.displayAvatarURL() ?? '', name: `${auditLog.executor?.tag ?? ''} (${auditLog.executor?.id ?? ''})` })
				.setTimestamp()
				.setColor(0x5CFF9D)
				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				.setDescription([`<:point:995372986179780758> **Member:** ${ban.user.tag} ${ban.user.id})`, `<:point:995372986179780758> **Action:** Unban`, `<:point:995372986179780758> **Reason:** ${translate("en-GB", "MODERATION_DEFAULT_REASON")}`].join("\n"))
				.setFooter({ text: `Manual Punishment` });

			return void await logChannel.send({ embeds: [embed] }).catch();
		});
	}
};

export default guildBanRemoveEvent;
