import { type APIApplicationCommandOption, ApplicationCommandOptionType, ApplicationCommandType, RESTPostAPIChatInputApplicationCommandsJSONBody, MessageFlags, type APIEmbed, PermissionFlagsBits } from "discord-api-types/v10";
import { Prisma } from "../../db.js";
import * as SlashCommand from "../../structures/Command.js";
import { Punishment } from "../../structures/Punishment.js";
import { CommandResponseType } from "../../utils/helpers.js";

export default class FreezeCommand extends SlashCommand.Handler<ApplicationCommandType.ChatInput> {
	public override data = {
		name: 'freeze',
		description: 'Prevent a case from being edited, locking it in time',
		type: ApplicationCommandType.ChatInput,
		dm_permission: false,
		default_member_permissions: PermissionFlagsBits.Administrator.toString(10),
	} satisfies Omit<RESTPostAPIChatInputApplicationCommandsJSONBody, "options"> & { type: ApplicationCommandType.ChatInput; };

	public override options = {
		"case_id": {
			type: ApplicationCommandOptionType.Integer,
			description: 'Which case to 🧊',
			required: true
		},
	} satisfies { [ string: string ]: Omit<APIApplicationCommandOption, "name"> };

	public override async execute({ interaction, respond, getArgs, api }: SlashCommand.RunContext<FreezeCommand>): SlashCommand.Returnable {
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
				title: "Case Already Frozen",
				color: 0xff5c5c,
				timestamp: new Date(Date.now()).toISOString()
			};

			return void await respond(interaction, CommandResponseType.Reply, { embeds: [embed], flags: MessageFlags.Ephemeral });
		}

		await Prisma.punishment.update({ where: { id: databaseEntry.id }, data: { flags: { push: ["Frozen"] }}});

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
				title: "Modified Case",
				color: 0x5cff9d,
				timestamp: new Date(Date.now()).toISOString()
			};

			return void await respond(interaction, CommandResponseType.Reply, { embeds: [embed], flags: MessageFlags.Ephemeral });
		}

		const [originalEmbed, components] = await Punishment.createEmbed(databaseEntry.id, channel.unwrap().id);

		if(databaseEntry.modLogId) {
			const message = await api.channels.getMessage(channel.unwrap().id, databaseEntry.modLogId);

			if(message) {
				// eslint-disable-next-line promise/valid-params
				await api.channels.editMessage(channel.unwrap().id, databaseEntry.modLogId, { embeds: [{ ...originalEmbed, fields: [{ name: 'Flags', value: '🧊 Frozen'}], timestamp: new Date(Date.now()).toISOString() }], components: [components] }).catch();
			}
		}

		const embed: APIEmbed = {
			title: "🧊 Punishment Modified",
			color: 0x64E2FC,
			timestamp: new Date(Date.now()).toISOString()
		};

		return void await respond(interaction, CommandResponseType.Reply, { embeds: [embed], flags: MessageFlags.Ephemeral });
	}
}