import { ApplicationCommandType, EmbedBuilder } from "discord.js";
import { InteractionManager, ResponseType } from "../../managers/InteractionManager.js";
import { FunctionType, IFunction, PermissionTier } from "../../structures/Interaction.js";

const AboutCommand: IFunction = {
	type: FunctionType.ChatInput,
	permissions: PermissionTier.User,
	async execute(interaction) {
		const embed = new EmbedBuilder()
			.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: interaction.user.tag })
			.setTimestamp()
			.setTitle("<:sentry:942693843269218334> About Sentry")
			.setColor(0x202225)
			.setDescription(['Sentry protects your guild from the next generation of discord scams. We have over 15 thousand data points which we use to prevent malicious users in your server, so that you can rest assured that your server will not fall prey to scams, and we are constantly improving, and tweaking our settings to ensure that the moment we find a new scam, its blocked by Sentry.\n', `<:point:995372986179780758> You are running Sentry v${process.env.SENTRY_VERSION ?? 'Unknown'}`].join('\n'));

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
