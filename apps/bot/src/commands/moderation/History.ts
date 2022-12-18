import type { PunishmentType } from "database";
import { type APIApplicationCommandOption, ApplicationCommandOptionType, ApplicationCommandType, RESTPostAPIChatInputApplicationCommandsJSONBody, type Snowflake, type APIEmbed, MessageFlags } from "discord-api-types/v10";
import * as SlashCommand from "../../structures/Command.js";
import { Punishment } from "../../structures/Punishment.js";
import { CommandResponseType } from "../../utils/helpers.js";

export default class HistoryCommand extends SlashCommand.Handler<ApplicationCommandType.ChatInput> {
	public override data = {
		name: 'history',
		description: 'Get the moderation history of a user',
		type: ApplicationCommandType.ChatInput,
		dm_permission: false,
	} satisfies Omit<RESTPostAPIChatInputApplicationCommandsJSONBody, "options"> & { type: ApplicationCommandType.ChatInput; };

	public override options = {
		"user": {
			type: ApplicationCommandOptionType.User,
			description: "Optional: Which user should Sentry lookup? Defaults to yourself.",
			required: false
		},
	} satisfies { [ string: string ]: Omit<APIApplicationCommandOption, "name"> };

	public override async execute({ interaction, getArgs, respond }: SlashCommand.RunContext<HistoryCommand>): SlashCommand.Returnable {
		const user = getArgs(interaction, "user") ?? interaction.member!.user;
		const cases = await Punishment.fetchUserPunishments(user.id, interaction.guild_id!);

		const description: `**${PunishmentType}** <t:${number}:R> by <@${Snowflake}>`[] = [];

		for(const modCase of cases) { 
			description.push(`**${modCase.type}** <t:${Math.round(modCase.createdAt.getTime() / 1_000)}:R> by <@${modCase.moderatorId}>`);
		}

		const embed: APIEmbed = {
			title: `Moderation History for ${user.username}#${user.discriminator}`,
			color: 0x313138,
			description: description.length > 0 ? `${description.slice(0, 15).join('\n')}${description.length > 10 ? `\n\n*and ${description.length - 10} more cases*` : ""}` : `<@${user.id}> has no moderation history in this guild!`,
			timestamp: new Date(Date.now()).toISOString()
		};

		return void await respond(interaction, CommandResponseType.Reply, { flags: MessageFlags.Ephemeral, embeds: [embed] });
	}
}