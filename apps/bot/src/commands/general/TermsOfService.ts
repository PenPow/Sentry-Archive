import { type APIApplicationCommandOption, ApplicationCommandType, RESTPostAPIChatInputApplicationCommandsJSONBody, type APIEmbed, MessageFlags } from "discord-api-types/v10";
import * as SlashCommand from "../../structures/Command.js";

export default class TOSCommand extends SlashCommand.Handler<ApplicationCommandType.ChatInput> {
	public override data = {
		name: 'terms-of-service',
		description: 'Read the Terms of Service with Sentry',
		type: ApplicationCommandType.ChatInput,
	} satisfies Omit<RESTPostAPIChatInputApplicationCommandsJSONBody, "options"> & { type: ApplicationCommandType.ChatInput; };

	public override options = {
	} satisfies { [ string: string ]: Omit<APIApplicationCommandOption, "name"> };

	public override async execute({}: SlashCommand.RunContext<TOSCommand>): SlashCommand.Returnable {
		const embed: APIEmbed = {
			title: "Terms of Service",
			description: "You can view the most recent version of our terms of service on our website [here](https://sentry.penpow.dev/legal/tos)",
			color: 0x313138,
			timestamp: new Date(Date.now()).toISOString()
		};

		return { embeds: [embed], flags: MessageFlags.Ephemeral };
	}
}