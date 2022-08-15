import { ApplicationCommandOptionType, ApplicationCommandType, EmbedBuilder, Locale, PermissionFlagsBits } from "discord.js";
import { translate } from "../../../common/translations/translate.js";
import { InteractionManager, ResponseType } from "../../managers/InteractionManager.js";
import { PunishmentManager } from "../../managers/PunishmentManager.js";
import { FunctionType, IFunction, PermissionTier } from "../../structures/Interaction.js";

const CaseCommand: IFunction = {
	type: FunctionType.ChatInput,
	permissions: PermissionTier.User,
	async execute(interaction) {
		if (!interaction.inCachedGuild()) return void await InteractionManager.sendInteractionResponse(interaction, { content: translate(interaction.locale, "GUILD_ONLY") }, ResponseType.Reply);

		const punishment = await PunishmentManager.fetchPunishment(interaction.options.getNumber(translate(Locale.EnglishGB, "REASON_CASE_OPTION_NAME"), true), interaction.guildId);

		if (punishment.isErr()) {
			const embed = new EmbedBuilder()
				.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
				.setTimestamp()
				.setColor(0xFF5C5C)
				.setTitle(translate(interaction.locale, "CASE_EMBED_TITLE"));

			return void await InteractionManager.sendInteractionResponse(interaction, { ephemeral: true, embeds: [embed] }, ResponseType.Reply);
		}

		const unwrapped = punishment.unwrap();

		return void await InteractionManager.sendInteractionResponse(interaction, { ephemeral: true, embeds: [await PunishmentManager.createPunishmentEmbed(interaction.guild, unwrapped, await interaction.guild.members.fetch(unwrapped.moderator)!, await interaction.client.users.fetch(unwrapped.userID)!, interaction.locale)] }, ResponseType.Reply);
	},
	toJSON() {
		return {
			name: "CASE_COMMAND_NAME",
			description: "CASE_COMMAND_DESCRIPTION",
			type: ApplicationCommandType.ChatInput,
			dm_permission: false,
			default_member_permissions: PermissionFlagsBits.ModerateMembers.toString(),
			options: [{
				name: "REASON_CASE_OPTION_NAME",
				description: "REASON_CASE_OPTION_DESCRIPTION",
				type: ApplicationCommandOptionType.Number,
				min_value: 0,
				required: true
			}]
		};
	},
};

export default CaseCommand;
