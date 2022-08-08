import { PunishmentType } from "@prisma/client";
import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { translate } from "../../../common/translations/translate.js";
import { InteractionManager, ResponseType } from "../../managers/InteractionManager.js";
import { PunishmentManager } from "../../managers/PunishmentManager.js";
import { FunctionType, IFunction, PermissionTier } from "../../structures/Interaction.js";

const HistoryCommand: IFunction = {
	type: FunctionType.ChatInput,
	permissions: PermissionTier.User,
	async execute(interaction) {
		const punishments = await PunishmentManager.fetchUserPunishments(interaction.options.getUser(translate("en-GB", "MODERATION_TARGET_OPTION_NAME"), true).id, interaction.guildId);

		const embed = new EmbedBuilder().setDescription([`<:point:995372986179780758> **${punishments.filter(punishment => punishment.type === PunishmentType.Ban).length}** Ban${punishments.filter(punishment => punishment.type === PunishmentType.Ban).length === 1 ? '' : 's'}`, `**${punishments.filter(punishment => punishment.type === PunishmentType.Softban).length}** Softban${punishments.filter(punishment => punishment.type === PunishmentType.Softban).length === 1 ? '' : 's'}`, `**${punishments.filter(punishment => punishment.type === PunishmentType.Kick).length}** Kick${punishments.filter(punishment => punishment.type === PunishmentType.Kick).length === 1 ? '' : 's'}`, `**${punishments.filter(punishment => punishment.type === PunishmentType.Timeout).length}** Timeout${punishments.filter(punishment => punishment.type === PunishmentType.Timeout).length === 1 ? '' : 's'}`, `**${punishments.filter(punishment => punishment.type === PunishmentType.Warn).length}** Warn${punishments.filter(punishment => punishment.type === PunishmentType.Warn).length === 1 ? '' : 's'}`].join('\n <:point:995372986179780758> '))
			.setTimestamp()
			.setColor(0xF79454)
			.setFooter({ text: `Page 1/${punishments.length + 1}` })
			.setTitle(`User History for ${interaction.options.getUser(translate("en-GB", "MODERATION_TARGET_OPTION_NAME"), true).tag}`);

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(...[new ButtonBuilder().setCustomId(`user-r:${interaction.options.getUser(translate("en-GB", "MODERATION_TARGET_OPTION_NAME"), true).id}-history-page-r:1-r:left`).setEmoji('⬅️')
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(true),
		new ButtonBuilder().setCustomId(`user-r:${interaction.options.getUser(translate("en-GB", "MODERATION_TARGET_OPTION_NAME"), true).id}-history-page-r:1-r:right`).setEmoji('➡️')
			.setStyle(ButtonStyle.Secondary)]);

		return void await InteractionManager.sendInteractionResponse(interaction, { ephemeral: true, embeds: [embed], components: [row] }, ResponseType.Reply);
	},
	toJSON() {
		return {
			name: "HISTORY_COMMAND_NAME",
			description: "HISTORY_COMMAND_DESCRIPTION",
			type: ApplicationCommandType.ChatInput,
			dm_permission: false,
			default_member_permissions: PermissionFlagsBits.ModerateMembers.toString(),
			options: [{
				name: "MODERATION_TARGET_OPTION_NAME",
				description: "HISTORY_COMMAND_USER_OPTION_DESCRIPTION",
				type: ApplicationCommandOptionType.User,
				required: true
			}]
		};
	},
};

export default HistoryCommand;
