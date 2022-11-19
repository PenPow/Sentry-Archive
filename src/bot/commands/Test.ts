import { type APIApplicationCommandOption, ApplicationCommandOptionType, ApplicationCommandType } from "discord-api-types/v10"
import { type RunContext, SlashCommand } from "../structures/Command.js"

export default class TestCommand extends SlashCommand<ApplicationCommandType.ChatInput> {
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
			type: ApplicationCommandOptionType.Number
		}
	} satisfies Record<string, Omit<APIApplicationCommandOption, 'name'>>

	public override execute({ getArgs }: RunContext<TestCommand>) {
		getArgs("test")
	}
}