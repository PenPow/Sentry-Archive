import { type APIApplicationCommandOption, ApplicationCommandType, RESTPostAPIChatInputApplicationCommandsJSONBody, type APIEmbed, MessageFlags } from "discord-api-types/v10";
import * as SlashCommand from "../../structures/Command.js";

export default class PrivacyCommand extends SlashCommand.Handler<ApplicationCommandType.ChatInput> {
	public override data = {
		name: 'privacy',
		description: 'View our Privacy Policy and learn about how we handle your data',
		type: ApplicationCommandType.ChatInput,
	} satisfies Omit<RESTPostAPIChatInputApplicationCommandsJSONBody, "options"> & { type: ApplicationCommandType.ChatInput; };

	public override options = {
	} satisfies { [ string: string ]: Omit<APIApplicationCommandOption, "name"> };

	public override async execute({}: SlashCommand.RunContext<PrivacyCommand>): SlashCommand.Returnable {
		const embed: APIEmbed = {
			title: "Privacy Policy",
			description: "You can view the most recent version of our privacy policy on our website [here](https://sentry.penpow.dev/legal/privacy)",
			color: 0x313138,
			timestamp: new Date(Date.now()).toISOString()
		};

		return { embeds: [embed], flags: MessageFlags.Ephemeral };
	}
}