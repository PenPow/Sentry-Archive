import { type APIApplicationCommandOption, ApplicationCommandOptionType, ApplicationCommandType, InteractionResponseType } from "discord-api-types/v10"
import { inspect } from "util"
import type { IClamAVResponse } from "../../../common/clamav.js"
import { AntiVirusBroker } from "../../brokers.js"
import * as SlashCommand from "../../structures/Command.js"

export default class TestCommand extends SlashCommand.Handler<ApplicationCommandType.ChatInput> {
	public override data = {
		name: 'test',
		description: 'Testing Attachments and ClamAV Brokers',
	}

	public override options = {
		"attachment": {
			description: 'Attachment to Scan',
			type: ApplicationCommandOptionType.Attachment,
			required: true
		},
	} satisfies Record<string, Omit<APIApplicationCommandOption, 'name'>>

	public override async execute({ getArgs, respond, interaction }: SlashCommand.RunContext<TestCommand>): SlashCommand.Returnable {
		respond(interaction, InteractionResponseType.DeferredChannelMessageWithSource, { flags: 64 })

		const attachment = await getArgs("attachment");

		const response: IClamAVResponse = await AntiVirusBroker.call('scan', Buffer.from(await (await fetch(attachment.url)).arrayBuffer()))

		return { content: `\`\`\`json\n${inspect(response)}\`\`\`` }
	}
}