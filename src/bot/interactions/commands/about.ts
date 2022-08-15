import { ApplicationCommandType, EmbedBuilder } from "discord.js";
import { translate } from "../../../common/translations/translate.js";
import { InteractionManager, ResponseType } from "../../managers/InteractionManager.js";
import { FunctionType, IFunction, PermissionTier } from "../../structures/Interaction.js";

const AboutCommand: IFunction = {
	type: FunctionType.ChatInput,
	permissions: PermissionTier.User,
	async execute(interaction) {
		const embed = new EmbedBuilder()
			.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: interaction.user.tag })
			.setTimestamp()
			.setTitle(translate(interaction.locale, "ABOUT_EMBED_TITLE"))
			.setColor(0x202225)
			.setDescription(translate(interaction.locale, "ABOUT_EMBED_DESCRIPTION"));

		return void await InteractionManager.sendInteractionResponse(interaction, { ephemeral: true, embeds: [embed] }, ResponseType.Reply);
	},
	toJSON() {
		return {
			name: "ABOUT_COMMAND_NAME",
			description: "ABOUT_COMMAND_DESCRIPTION",
			type: ApplicationCommandType.ChatInput,
		};
	},
};

export default AboutCommand;
