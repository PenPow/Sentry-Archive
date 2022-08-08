import { PunishmentType } from "@prisma/client";
import { ActionRowBuilder, ApplicationCommandType, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits, UserContextMenuCommandInteraction } from "discord.js";
import { InteractionManager, ResponseType } from "../../managers/InteractionManager.js";
import { PunishmentManager } from "../../managers/PunishmentManager.js";
import { FunctionType, IFunction, PermissionTier } from "../../structures/Interaction.js";

const HistoryCommand: IFunction = {
	type: FunctionType.ContextMenu,
	permissions: PermissionTier.User,
	async execute(interaction) {
		if (!interaction.inCachedGuild()) return void await InteractionManager.sendInteractionResponse(interaction, { content: "Please run these commands in a guild!" }, ResponseType.Reply);

		const punishments = await PunishmentManager.fetchUserPunishments((interaction as UserContextMenuCommandInteraction).targetUser.id, interaction.guildId);

		const embed = new EmbedBuilder().setDescription([`<:point:995372986179780758> **${punishments.filter(punishment => punishment.type === PunishmentType.Ban).length}** Ban${punishments.filter(punishment => punishment.type === PunishmentType.Ban).length === 1 ? '' : 's'}`, `**${punishments.filter(punishment => punishment.type === PunishmentType.Softban).length}** Softban${punishments.filter(punishment => punishment.type === PunishmentType.Softban).length === 1 ? '' : 's'}`, `**${punishments.filter(punishment => punishment.type === PunishmentType.Kick).length}** Kick${punishments.filter(punishment => punishment.type === PunishmentType.Kick).length === 1 ? '' : 's'}`, `**${punishments.filter(punishment => punishment.type === PunishmentType.Timeout).length}** Timeout${punishments.filter(punishment => punishment.type === PunishmentType.Timeout).length === 1 ? '' : 's'}`, `**${punishments.filter(punishment => punishment.type === PunishmentType.Warn).length}** Warn${punishments.filter(punishment => punishment.type === PunishmentType.Warn).length === 1 ? '' : 's'}`].join('\n <:point:995372986179780758> '))
			.setTimestamp()
			.setColor(0xF79454)
			.setFooter({ text: `Page 1/${punishments.length + 1}` })
			.setTitle(`User History for ${(interaction as UserContextMenuCommandInteraction).targetUser.tag}`);

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(...[new ButtonBuilder().setCustomId(`user-r:${(interaction as UserContextMenuCommandInteraction).targetUser.id}-history-page-r:1-r:left`).setEmoji('⬅️')
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(true),
		new ButtonBuilder().setCustomId(`user-r:${(interaction as UserContextMenuCommandInteraction).targetUser.id}-history-page-r:1-r:right`).setEmoji('➡️')
			.setStyle(ButtonStyle.Secondary)]);

		return void await InteractionManager.sendInteractionResponse(interaction, { ephemeral: true, embeds: [embed], components: [row] }, ResponseType.Reply);
	},
	toJSON() {
		return {
			name: "HISTORY_CONTEXT_NAME",
			type: ApplicationCommandType.User,
			default_member_permissions: PermissionFlagsBits.ModerateMembers.toString()
		};
	},
};

export default HistoryCommand;
