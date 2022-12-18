import { type APIApplicationCommandOption, ApplicationCommandOptionType, ApplicationCommandType, RESTPostAPIChatInputApplicationCommandsJSONBody, type APIEmbed, MessageFlags, PermissionFlagsBits } from "discord-api-types/v10";
import { Prisma } from "../../db.js";
import * as SlashCommand from "../../structures/Command.js";
import { Punishment } from "../../structures/Punishment.js";
import { CommandResponseType } from "../../utils/helpers.js";

export default class EditCommand extends SlashCommand.Handler<ApplicationCommandType.ChatInput> {
	public override data = {
		name: 'edit',
		description: 'Edit a case',
		type: ApplicationCommandType.ChatInput,
		dm_permission: false,
		default_member_permissions: PermissionFlagsBits.Administrator.toString(10),
	} satisfies Omit<RESTPostAPIChatInputApplicationCommandsJSONBody, "options"> & { type: ApplicationCommandType.ChatInput; };

	public override options = {
		"case_id": {
			type: ApplicationCommandOptionType.Integer,
			description: 'Which case to modify?',
			required: true
		},
		"reason": {
			type: ApplicationCommandOptionType.String,
			description: 'What is the new reason for the case?',
			required: true
		},
	} satisfies { [ string: string ]: Omit<APIApplicationCommandOption, "name"> };

	public override async execute({ interaction, getArgs, respond, api }: SlashCommand.RunContext<EditCommand>): SlashCommand.Returnable {
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

		if(databaseEntry.flags.includes("Frozen")) {
			const embed: APIEmbed = {
				title: "🧊 Cannot Modify Frozen Case",
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

		const reason = await getArgs(interaction, "reason");
		await Prisma.punishment.update({ where: { id: databaseEntry.id }, data: { reason }});

		const channel = await Punishment.getAuditLogChannel(guild);

		if(channel.isErr()) {
			const embed: APIEmbed = {
				title: "Modified Case",
				color: 0x5cff9d,
				timestamp: new Date(Date.now()).toISOString()
			};

			return void await respond(interaction, CommandResponseType.Reply, { embeds: [embed], flags: MessageFlags.Ephemeral });
		}
		
		const [embed, components] = await Punishment.createEmbed(databaseEntry.id, channel.unwrap().id);

		databaseEntry.reason = reason;

		const updatedEmbed = databaseEntry.flags.includes("Frozen") ? { ...embed, fields: [{ name: 'Flags', value: '🧊 Frozen'}] } satisfies APIEmbed : embed;

		if(databaseEntry.modLogId) {
			const message = await api.channels.getMessage(channel.unwrap().id, databaseEntry.modLogId);

			if(message) {
				// eslint-disable-next-line promise/valid-params
				await api.channels.editMessage(channel.unwrap().id, databaseEntry.modLogId, { embeds: [{ ...updatedEmbed, timestamp: new Date(Date.now()).toISOString() }], components: [components] }).catch();
			}
		}

		return void await respond(interaction, CommandResponseType.Reply, { embeds: [{ ...updatedEmbed, timestamp: new Date(Date.now()).toISOString() }], components: [components], flags: MessageFlags.Ephemeral });
	}
}