import { type APIApplicationCommandOption, ApplicationCommandOptionType, ApplicationCommandType, InteractionResponseType, MessageFlags } from "discord-api-types/v10"
import * as SlashCommand from "../../structures/Command.js"

export default class TestCommand extends SlashCommand.Handler<ApplicationCommandType.ChatInput> {
	public override data = {
		name: 'hello',
		description: 'world',
	}

	public override options = {
		"name": {
			description: 'test',
			type: ApplicationCommandOptionType.String
		},
		"test": {
			description: 'test',
			type: ApplicationCommandOptionType.User
		}
	} satisfies Record<string, Omit<APIApplicationCommandOption, 'name'>>

	public override async execute({ getArgs, respond, interaction }: SlashCommand.RunContext<TestCommand>): SlashCommand.Returnable {
		await respond(interaction, InteractionResponseType.ChannelMessageWithSource, { flags: MessageFlags.Ephemeral, content: (await getArgs("test"))!.username })
	}
}