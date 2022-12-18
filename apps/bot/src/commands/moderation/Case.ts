import { type APIApplicationCommandOption, ApplicationCommandOptionType, ApplicationCommandType, RESTPostAPIChatInputApplicationCommandsJSONBody, type APIEmbed, MessageFlags } from "discord-api-types/v10";
import { Prisma } from "../../db.js";
import * as SlashCommand from "../../structures/Command.js";
import { Punishment } from "../../structures/Punishment.js";
import { CommandResponseType } from "../../utils/helpers.js";

export default class CaseCommand extends SlashCommand.Handler<ApplicationCommandType.ChatInput> {
	public override data = {
		name: 'case',
		description: 'Grab the details of a case',
		type: ApplicationCommandType.ChatInput,
		dm_permission: false,
	} satisfies Omit<RESTPostAPIChatInputApplicationCommandsJSONBody, "options"> & { type: ApplicationCommandType.ChatInput; };

	public override options = {
		"case_id": {
			type: ApplicationCommandOptionType.Integer,
			description: 'Which case to fetch the details of?',
			required: true
		},
	} satisfies { [ string: string ]: Omit<APIApplicationCommandOption, "name"> };

	public override async execute({ interaction, getArgs, respond }: SlashCommand.RunContext<CaseCommand>): SlashCommand.Returnable {
		const caseId = await getArgs(interaction, "case_id");
		const databaseEntry = await Punishment.fetch({ caseId, guildId: interaction.guild_id! });

		if(!databaseEntry) {
			const embed: APIEmbed = {
				title: "No Case Found",
				color: 0xff5c5c,
				timestamp: new Date(Date.now()).toISOString()
			};

			return void await respond(interaction, CommandResponseType.Reply, { embeds: [embed], flags: MessageFlags.Ephemeral });
		}

		await Punishment.createUserAndGuild(interaction.member!.user.id, interaction.guild_id!);
		const guild = await Prisma.guild.findUnique({
			where: { id: interaction.guild_id! },
		});

		if(!guild) {
			const embed: APIEmbed = {
				title: "No Case Found",
				color: 0xff5c5c,
				timestamp: new Date(Date.now()).toISOString()
			};

			return void await respond(interaction, CommandResponseType.Reply, { embeds: [embed], flags: MessageFlags.Ephemeral });
		}

		const channel = await Punishment.getAuditLogChannel(guild);

		if(channel.isErr()) {
			const embed: APIEmbed = {
				title: "No Case Found",
				color: 0xff5c5c,
				timestamp: new Date(Date.now()).toISOString()
			};

			return void await respond(interaction, CommandResponseType.Reply, { embeds: [embed], flags: MessageFlags.Ephemeral });
		}
		
		const [embed, components] = await Punishment.createEmbed(databaseEntry.id, channel.unwrap().id);

		const updatedEmbed = databaseEntry.flags.includes("Frozen") ? { ...embed, fields: [{ name: 'Flags', value: '🧊 Frozen'}] } satisfies APIEmbed : embed;

		return void await respond(interaction, CommandResponseType.Reply, { embeds: [{ ...updatedEmbed, timestamp: databaseEntry.updatedAt.toISOString() }], components: [components], flags: MessageFlags.Ephemeral });
	}
}