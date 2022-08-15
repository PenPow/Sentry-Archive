import * as Sentry from "@sentry/node";
import { ApplicationCommandOptionType, ApplicationCommandType, ChannelType, EmbedBuilder, Locale, PermissionFlagsBits } from "discord.js";
import { prisma } from "../../../common/db.js";
import { translate } from "../../../common/translations/translate.js";
import { InteractionManager, ResponseType } from "../../managers/InteractionManager.js";
import { PunishmentManager } from "../../managers/PunishmentManager.js";
import { SettingsManager } from "../../managers/SettingsManager.js";
import { FunctionType, IFunction, PermissionTier } from "../../structures/Interaction.js";

const ReasonCommand: IFunction = {
	type: FunctionType.ChatInput,
	permissions: PermissionTier.User,
	async execute(interaction) {
		if (!interaction.inCachedGuild()) return void await InteractionManager.sendInteractionResponse(interaction, { content: translate(interaction.locale, "GUILD_ONLY") }, ResponseType.Reply);

		const [success, modal] = await PunishmentManager.handleUser2FA(interaction, interaction.user.id);

		if (!success) return;

		const punishment = await PunishmentManager.fetchPunishment(interaction.options.getNumber(translate(Locale.EnglishGB, "REASON_CASE_OPTION_NAME"), true), interaction.guildId);

		if (punishment.isErr()) {
			const embed = new EmbedBuilder()
				.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
				.setTimestamp()
				.setColor(0xFF5C5C)
				.setTitle(translate(interaction.locale, "AN_ERROR_OCCURRED"));

			return void await InteractionManager.sendInteractionResponse(modal ?? interaction, { ephemeral: true, embeds: [embed] }, ResponseType.Reply);
		}

		const unwrapped = punishment.unwrap();

		await prisma.punishment.update({ data: { reason: interaction.options.getString(translate(Locale.EnglishGB, "REASON_NEWREASON_OPTION_NAME"), true).substring(0, 900) }, where: { id: unwrapped.id } });

		const logChannel = (await SettingsManager.getSettings(interaction.guildId)).logChannelId ? await interaction.guild.channels.fetch((await SettingsManager.getSettings(interaction.guildId)).logChannelId!) : interaction.guild.channels.cache.find(val => ["logs", "audit-logs", "server-logs", "sentry-logs", "guild-logs", "mod-logs", "modlogs"].includes(val.name));

		if (!logChannel || logChannel.type !== ChannelType.GuildText || unwrapped.modLogID === null) {
			const embed = new EmbedBuilder()
				.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
				.setTimestamp()
				.setColor(0xFF5C5C)
				.setTitle(translate(interaction.locale, "NO_LOG_CHANNEL"));

			return void await InteractionManager.sendInteractionResponse(modal ?? interaction, { ephemeral: true, embeds: [embed] }, ResponseType.Reply);
		}

		const msg = await logChannel.messages.fetch(unwrapped.modLogID).catch(e => void Sentry.captureException(e));

		if (!msg || msg.embeds.length === 0) {
			const embed = new EmbedBuilder()
				.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
				.setTimestamp()
				.setColor(0xFF5C5C)
				.setTitle(translate(interaction.locale, "NO_LOG_MESSAGE"));

			return void await InteractionManager.sendInteractionResponse(modal ?? interaction, { ephemeral: true, embeds: [embed] }, ResponseType.Reply);
		}

		const embed = EmbedBuilder.from(msg.embeds[0]);

		const description = embed.data.description?.split('\n') ?? [];
		description[2] = translate(interaction.guildLocale, "REASON_EMBED_NEW_REASON", interaction.options.getString(translate(Locale.EnglishGB, "REASON_NEWREASON_OPTION_NAME"), true).substring(0, 900));

		embed.setDescription(description.join('\n'));
		await InteractionManager.sendInteractionResponse(modal ?? interaction, { ephemeral: true, embeds: [embed] }, ResponseType.Reply);

		return void await msg.edit({ embeds: [embed] }).catch(e => void Sentry.captureException(e));
	},
	toJSON() {
		return {
			name: "REASON_COMMAND_NAME",
			description: "REASON_COMMAND_DESCRIPTION",
			type: ApplicationCommandType.ChatInput,
			dm_permission: false,
			default_member_permissions: PermissionFlagsBits.ModerateMembers.toString(),
			options: [{
				name: "REASON_CASE_OPTION_NAME",
				description: "REASON_CASE_OPTION_DESCRIPTION",
				type: ApplicationCommandOptionType.Number,
				min_value: 0,
				required: true
			},
			{
				name: "REASON_NEWREASON_OPTION_NAME",
				description: "REASON_NEWREASON_OPTION_DESCRIPTION",
				type: ApplicationCommandOptionType.String,
				required: true
			}]
		};
	},
};

export default ReasonCommand;
