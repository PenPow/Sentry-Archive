import type { API } from "@discordjs/core";
import type { Result } from "@sapphire/result";
import { type APIApplicationCommandOption, ApplicationCommandOptionType, ApplicationCommandType, RESTPostAPIChatInputApplicationCommandsJSONBody, MessageFlags, type APIEmbed, PermissionFlagsBits, ComponentType, type APIModalSubmitInteraction, TextInputStyle, type APIChatInputApplicationCommandInteraction } from "discord-api-types/v10";
import { nanoid } from "nanoid";
import { Prisma } from "../../db.js";
import { TwoFactorAuthenticationManager } from "../../structures/2FAManager.js";
import * as SlashCommand from "../../structures/Command.js";
import { Punishment } from "../../structures/Punishment.js";
import { CommandResponseType, type DataType, type ValidDataTypes } from "../../utils/helpers.js";

type Options = { case_id: number };
const inProgress: Map<string, Options> = new Map();

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
		const guild = await api.guilds.get(interaction.guild_id!);
		
		const guild2FARequirement = await TwoFactorAuthenticationManager.doesUserRequire2FA(guild);
		const userHas2FA = await TwoFactorAuthenticationManager.has2FAEnabled(interaction.member!.user.id);
		
		if(guild2FARequirement && !userHas2FA) {
			const embed: APIEmbed = {
				title: "🚨 Please Enable 2FA",
				description: "This server requires two factor authentication through Sentry to be enabled before taking moderation actions, please enable this through Sentry and try again.",
				color: 0xff5c5c,
				timestamp: new Date(Date.now()).toISOString()
			};

			return void await respond(interaction, CommandResponseType.Reply, { embeds: [embed], flags: MessageFlags.Ephemeral });
		}

		if(userHas2FA) {
			const id = nanoid().replaceAll('.', '-');
			await respond(interaction, CommandResponseType.Modal, { custom_id: `${this.data.name}.twofactor.ask.${id}`, title: 'Verify 2FA', components: [{ type: ComponentType.ActionRow, components: [{ type: ComponentType.TextInput, style: TextInputStyle.Short, min_length: 6, max_length: 6, custom_id: `${this.data.name}.twofactor.ask.${id}.option.code`, placeholder: "XXXXXX", required: true, label: "Enter your Two Factor Authentication Code" }]}]});

			inProgress.set(id, { case_id: await getArgs(interaction, "case_id") });
		} else {
			await this.freezeCase({ interaction, api, options: { case_id: await getArgs(interaction, "case_id") }, respond });
		}
	}

	public override async handleModal({ interaction, respond, api }: Omit<SlashCommand.RunContext<any>, "getArgs" | "interaction"> & { interaction: APIModalSubmitInteraction; }): Promise<void> {
		const codeOption = interaction.data.components[0]?.components.find((input) => input.custom_id.split('.')[5] === "code"); // ban.twofactor.ask.[nanoid].option.[option name]

		const verified = await TwoFactorAuthenticationManager.verifyUser2FA(interaction.member!.user.id, codeOption!.value, false);
		if(!verified) {
			const embed: APIEmbed = {
				title: "🚨 Failed to Verify 2FA Token",
				description: "Please double check your 2FA token, or use a backup code if you do not have access to your authenticator app.",
				color: 0xff5c5c,
				timestamp: new Date(Date.now()).toISOString()
			};

			return void await respond(interaction, CommandResponseType.Reply, { embeds: [embed], flags: MessageFlags.Ephemeral });
		}


		const data = inProgress.get(interaction.data.custom_id.split('.')[3]!);
		await this.freezeCase({ interaction, api, options: data!, respond });
	}

	public async freezeCase({ interaction, api, options, respond }: { api: API, interaction: APIChatInputApplicationCommandInteraction | APIModalSubmitInteraction, options: Options, respond(interaction: APIChatInputApplicationCommandInteraction | APIModalSubmitInteraction, responseType: ValidDataTypes<APIChatInputApplicationCommandInteraction | APIModalSubmitInteraction>, data: DataType<ValidDataTypes<APIChatInputApplicationCommandInteraction | APIModalSubmitInteraction>>): Promise<Result<true, Error>> }) {
		const caseId = options.case_id;
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