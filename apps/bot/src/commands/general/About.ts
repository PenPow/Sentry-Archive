import { type APIApplicationCommandOption, ApplicationCommandType, RESTPostAPIChatInputApplicationCommandsJSONBody, type APIEmbed, MessageFlags } from "discord-api-types/v10";
import * as SlashCommand from "../../structures/Command.js";

export default class AboutCommand extends SlashCommand.Handler<ApplicationCommandType.ChatInput> {
	public override data = {
		name: 'about',
		description: 'Learn more about Sentry',
		type: ApplicationCommandType.ChatInput,
	} satisfies Omit<RESTPostAPIChatInputApplicationCommandsJSONBody, "options"> & { type: ApplicationCommandType.ChatInput; };

	public override options = {
	} satisfies { [ string: string ]: Omit<APIApplicationCommandOption, "name"> };

	public override async execute({}: SlashCommand.RunContext<AboutCommand>): SlashCommand.Returnable {
		const embed: APIEmbed = {
			title: "Sentry Makes Moderation Simple.",
			description: "Sentry is a Discord Moderation bot that makes moderation simple again. We focus on providing features to level up your server's security, with a strong focus on simplicity.\n\nYou can view more about our project over at [our website](https://sentry.penpow.dev).",
			color: 0x313138,
			timestamp: new Date(Date.now()).toISOString()
		};

		return { embeds: [embed], flags: MessageFlags.Ephemeral };
	}
}