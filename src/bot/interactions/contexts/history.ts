import { ActionRowBuilder, ApplicationCommandType, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits, UserContextMenuCommandInteraction } from "discord.js";
import { translate } from "../../../common/translations/translate.js";
import { InteractionManager, ResponseType } from "../../managers/InteractionManager.js";
import { PunishmentManager } from "../../managers/PunishmentManager.js";
import { FunctionType, IFunction, PermissionTier } from "../../structures/Interaction.js";

const HistoryCommand: IFunction = {
	type: FunctionType.ContextMenu,
	permissions: PermissionTier.User,
	async execute(interaction) {
		if (!interaction.inCachedGuild()) return void await InteractionManager.sendInteractionResponse(interaction, { content: translate(interaction.locale, "GUILD_ONLY") }, ResponseType.Reply);

		const punishments = await PunishmentManager.fetchUserPunishments((interaction as UserContextMenuCommandInteraction).targetUser.id, interaction.guildId);

		const embed = new EmbedBuilder().setDescription(translate(interaction.locale, "PUNISHMENT_PROMPT_DESCRIPTION", punishments))
			.setTimestamp()
			.setColor(0xF79454)
			.setFooter({ text: translate(interaction.locale, "HISTORY_PAGE_NUMBER", 1, punishments.length + 1) })
			.setTitle(translate(interaction.locale, "HISTORY_EMBED_TITLE_1", (interaction as UserContextMenuCommandInteraction).targetUser.tag));

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(...[new ButtonBuilder().setCustomId(`user-r:${(interaction as UserContextMenuCommandInteraction).targetUser.id}-history-page-r:1-r:left`).setEmoji('⬅️')
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(true),
		new ButtonBuilder().setCustomId(`user-r:${(interaction as UserContextMenuCommandInteraction).targetUser.id}-history-page-r:1-r:right`).setEmoji('➡️')
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(punishments.length === 0 ? true : false)]);

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
