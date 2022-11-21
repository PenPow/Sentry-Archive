// import { PunishmentType } from "database"
import { type APIApplicationCommandOption, ApplicationCommandOptionType, ApplicationCommandType, InteractionResponseType } from "discord-api-types/v10"
import { inspect } from "node:util"
import * as SlashCommand from "../../structures/Command.js"
// import { Punishment } from "../../structures/Punishment.js"

export default class TestCommand extends SlashCommand.Handler<ApplicationCommandType.ChatInput> {
	public override data = {
		name: 'test',
		description: 'punishment time',
	}

	public override options = {
		"user": {
			description: 'Select the User',
			type: ApplicationCommandOptionType.User,
			required: true
		},
	} satisfies Record<string, Omit<APIApplicationCommandOption, 'name'>>

	public override async execute({ getArgs, respond, interaction }: SlashCommand.RunContext<TestCommand>): SlashCommand.Returnable {
		console.log("hi")
		
		respond(interaction, InteractionResponseType.DeferredChannelMessageWithSource, { flags: 64 })

		const user = await getArgs("user");

		// const punishment = await new Punishment({ type: PunishmentType.Timeout, reason: 'ur bad pt 4', userId: user.id, guildId: interaction.guild_id!, references: 20, expiration: new Date(new Date(Date.now()).getTime() + 50000), moderatorId: interaction.member?.user.id! }).run()
		
		return { content: `\`\`\`js\n${inspect(user)}\`\`\`` }
	}
}