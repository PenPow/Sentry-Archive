import type { API } from "@discordjs/core";
import type { Result } from "@sapphire/result";
import { type APIApplicationCommandOption, ApplicationCommandOptionType, ApplicationCommandType, RESTPostAPIChatInputApplicationCommandsJSONBody, type APIEmbed, MessageFlags, PermissionFlagsBits, type APIUser, type APIChatInputApplicationCommandInteraction, type APIModalSubmitInteraction, ComponentType, TextInputStyle } from "discord-api-types/v10";
import { nanoid } from "nanoid";
import { TwoFactorAuthenticationManager } from "../../structures/2FAManager.js";
import * as SlashCommand from "../../structures/Command.js";
import { UnbanPunishment } from "../../structures/Punishment.js";
import { CommandResponseType, type DataType, type ValidDataTypes } from "../../utils/helpers.js";

type Options = { reason: string, references?: number, user: APIUser };
const inProgress: Map<string, Options> = new Map();

export default class KickCommand extends SlashCommand.Handler<ApplicationCommandType.ChatInput> {
	public override data = {
		name: 'unban',
		description: 'Re-admit a user into your server',
		type: ApplicationCommandType.ChatInput,
		dm_permission: false,
		default_member_permissions: PermissionFlagsBits.BanMembers.toString(10),
	} satisfies Omit<RESTPostAPIChatInputApplicationCommandsJSONBody, "options"> & { type: ApplicationCommandType.ChatInput; };

	public override options = {
		"user": {
			type: ApplicationCommandOptionType.User,
			description: "Which user should Sentry unban? Enter their user-id here",
			required: true
		},
		"reason": {
			type: ApplicationCommandOptionType.String,
			description: 'What should we put as the reason in the logs?',
			required: true
		},
		"case_reference": {
			type: ApplicationCommandOptionType.Integer,
			description: 'Optional: Enter a case number to add as a reference to this case',
			required: false
		},
	} satisfies { [ string: string ]: Omit<APIApplicationCommandOption, "name"> };

	public override async execute({ interaction, respond, getArgs, api }: SlashCommand.RunContext<KickCommand>): SlashCommand.Returnable {
		if((await TwoFactorAuthenticationManager.has2FAEnabled(interaction.member!.user.id))) {
			const id = nanoid().replaceAll('.', '-');
			await respond(interaction, CommandResponseType.Modal, { custom_id: `${this.data.name}.twofactor.ask.${id}`, title: 'Verify 2FA', components: [{ type: ComponentType.ActionRow, components: [{ type: ComponentType.TextInput, style: TextInputStyle.Short, min_length: 6, max_length: 6, custom_id: `${this.data.name}.twofactor.ask.${id}.option.code`, placeholder: "XXXXXX", required: true, label: "Enter your Two Factor Authentication Code" }]}]});

			inProgress.set(id, { user: await getArgs(interaction, "user"), reason: await getArgs(interaction, "reason"), references: await getArgs(interaction, "case_reference") ?? undefined });
		} else {
			await respond(interaction, CommandResponseType.Defer, { flags: MessageFlags.Ephemeral });
			await this.createPunishment({ interaction, api, options: { reason: await getArgs(interaction, "reason"), user: await getArgs(interaction, "user"), references: await getArgs(interaction, "case_reference") ?? undefined}, respond });
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

		await respond(interaction, CommandResponseType.Defer, { flags: MessageFlags.Ephemeral });

		const data = inProgress.get(interaction.data.custom_id.split('.')[3]!);
		await this.createPunishment({ interaction, api, options: data!, respond });
	}

	public async createPunishment({ interaction, api, options, respond }: { api: API, interaction: APIChatInputApplicationCommandInteraction | APIModalSubmitInteraction, options: Options, respond(interaction: APIChatInputApplicationCommandInteraction | APIModalSubmitInteraction, responseType: ValidDataTypes<APIChatInputApplicationCommandInteraction | APIModalSubmitInteraction>, data: DataType<ValidDataTypes<APIChatInputApplicationCommandInteraction | APIModalSubmitInteraction>>): Promise<Result<true, Error>> }) {
		const user = options.user;
		const reason = options.reason;
		const references = options.references ?? null;

		const guild = await api.guilds.get(interaction.guild_id!);


		const punishment = await new UnbanPunishment({ guildId: guild.id, moderatorId: interaction.member!.user.id, references, userId: user.id, reason }).build();

		if(punishment.isOk()) {
			const embed: APIEmbed = {
				title: "Unban Created",
				color: 0x5cff9d,
				timestamp: new Date(Date.now()).toISOString()
			};

			return void await respond(interaction, CommandResponseType.EditReply, { flags: MessageFlags.Ephemeral, embeds: [embed] });
		} else {
			const embed: APIEmbed = {
				title: "Cannot Create Unban",
				description: "Sentry cannot create this unban, this may be because\n🔹You are missing the requisite permissions\n🔹Sentry is lacking the correct permissions",
				color: 0xff5c5c,
				timestamp: new Date(Date.now()).toISOString()
			};
	
			return void await respond(interaction, CommandResponseType.EditReply, { flags: MessageFlags.Ephemeral, embeds: [embed] });
		}
	}
}