import { ApplicationCommandType } from "discord-api-types/v10"
import { Command } from "../structures/Command"

export default {
	type: ApplicationCommandType.ChatInput,
	json: { name: 'hello', type: ApplicationCommandType.ChatInput, description: 'world' },
	execute: async () => {
		console.log("Hi")
	}
} as Command