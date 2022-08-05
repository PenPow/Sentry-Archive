import { ApplicationCommandOptionType, ApplicationCommandType, ChannelType, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { prisma } from "../../../common/db.js";
import { translate } from "../../../common/translations/translate.js";
import { InteractionManager, ResponseType } from "../../managers/InteractionManager.js";
import { PunishmentManager } from "../../managers/PunishmentManager.js";
import { FunctionType, IFunction, PermissionTier } from "../../structures/Interaction.js";

const ReasonCommand: IFunction = {
	type: FunctionType.ChatInput,
	permissions: PermissionTier.User,
	async execute(interaction) {
		const [success, modal] = await PunishmentManager.handleUser2FA(interaction, interaction.user.id);

		if (!success) return;

		const punishment = await PunishmentManager.fetchPunishment(interaction.options.getNumber(translate("en-GB", "REASON_CASE_OPTION_NAME"), true), interaction.guildId);

		if (punishment.isErr()) {
			const embed = new EmbedBuilder()
				.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
				.setTimestamp()
				.setColor(0xFF5C5C)
				.setTitle(`❌ Cannot Find Case`);

			return void await InteractionManager.sendInteractionResponse(modal ?? interaction, { ephemeral: true, embeds: [embed] }, ResponseType.Reply);
		}

		const unwrapped = punishment.unwrap();

		await prisma.punishment.update({ data: { reason: interaction.options.getString(translate("en-GB", "REASON_NEWREASON_OPTION_NAME"), true).substring(0, 900) }, where: { id: unwrapped.id } });

		const logChannel = interaction.guild.channels.cache.find(val => ["logs", "audit-logs", "server-logs", "sentry-logs", "guild-logs", "mod-logs", "modlogs"].includes(val.name));

		if (!logChannel || logChannel.type !== ChannelType.GuildText || unwrapped.modLogID === null) {
			const embed = new EmbedBuilder()
				.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
				.setTimestamp()
				.setColor(0xFF5C5C)
				.setTitle(`❌ Cannot Find Log Channel`);

			return void await InteractionManager.sendInteractionResponse(modal ?? interaction, { ephemeral: true, embeds: [embed] }, ResponseType.Reply);
		}

		const msg = await logChannel.messages.fetch(unwrapped.modLogID).catch(() => null);

		if (!msg || msg.embeds.length === 0) {
			const embed = new EmbedBuilder()
				.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
				.setTimestamp()
				.setColor(0xFF5C5C)
				.setTitle(`❌ Cannot Find Log Message`);

			return void await InteractionManager.sendInteractionResponse(modal ?? interaction, { ephemeral: true, embeds: [embed] }, ResponseType.Reply);
		}

		const embed = EmbedBuilder.from(msg.embeds[0]);

		const description = embed.data.description?.split('\n') ?? [];
		description[2] = `<:point:995372986179780758> **Reason:** ${interaction.options.getString(translate("en-GB", "REASON_NEWREASON_OPTION_NAME"), true).substring(0, 900)}`;

		embed.setDescription(description.join('\n'));
		await InteractionManager.sendInteractionResponse(modal ?? interaction, { ephemeral: true, embeds: [embed] }, ResponseType.Reply);

		return void await msg.edit({ embeds: [embed] }).catch();
	},
	toJSON() {
		return {
			name: "REASON_COMMAND_NAME",
			description: "REASON_COMMAND_DESCRIPTION",
			type: ApplicationCommandType.ChatInput,
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
