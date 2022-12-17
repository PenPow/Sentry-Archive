import type { API } from "@discordjs/core";
import { Result } from "@sapphire/result";
import { type APIApplicationCommandOption, ApplicationCommandOptionType, ApplicationCommandType, RESTPostAPIChatInputApplicationCommandsJSONBody, type APIEmbed, MessageFlags, PermissionFlagsBits, type APIUser, type APIChatInputApplicationCommandInteraction, type APIModalSubmitInteraction, ComponentType, TextInputStyle } from "discord-api-types/v10";
import ms from "ms";
import { nanoid } from "nanoid";
import { TwoFactorAuthenticationManager } from "../../structures/2FAManager.js";
import * as SlashCommand from "../../structures/Command.js";
import { ExpiringPunishment } from "../../structures/Punishment.js";
import { PermissionsManager } from "../../utils/PermissionsHelpers.js";
import { CommandResponseType, type DataType, type ValidDataTypes } from "../../utils/helpers.js";

type Options = { expiration: string, reason: string, references?: number, user: APIUser };
const inProgress: Map<string, Options> = new Map();

export default class TimeoutCommand extends SlashCommand.Handler<ApplicationCommandType.ChatInput> {
	public override data = {
		name: 'timeout',
		description: 'Prevent a user from sending and reacting to messages, and joining voice channels',
		type: ApplicationCommandType.ChatInput,
		dm_permission: false,
		default_member_permissions: PermissionFlagsBits.ModerateMembers.toString(10),
	} satisfies Omit<RESTPostAPIChatInputApplicationCommandsJSONBody, "options"> & { type: ApplicationCommandType.ChatInput; };

	public override options = {
		"user": {
			type: ApplicationCommandOptionType.User,
			description: "Which user should Sentry timeout?",
			required: true
		},
		"reason": {
			type: ApplicationCommandOptionType.String,
			description: 'What should we put as the reason in the logs?',
			required: true
		},
		"duration": {
			type: ApplicationCommandOptionType.String,
			description: 'How long should this timeout last for, up to 28 days (in the format of [time]s/m/h/d/w)',
			required: true
		},
		"case_reference": {
			type: ApplicationCommandOptionType.Integer,
			description: 'Optional: Enter a case number to add as a reference to this case',
			required: false
		},
	} satisfies { [ string: string ]: Omit<APIApplicationCommandOption, "name"> };

	public override async execute({ interaction, respond, getArgs, api }: SlashCommand.RunContext<TimeoutCommand>): SlashCommand.Returnable {
		if((await TwoFactorAuthenticationManager.has2FAEnabled(interaction.member!.user.id))) {
			const id = nanoid().replaceAll('.', '-');
			await respond(interaction, CommandResponseType.Modal, { custom_id: `${this.data.name}.twofactor.ask.${id}`, title: 'Verify 2FA', components: [{ type: ComponentType.ActionRow, components: [{ type: ComponentType.TextInput, style: TextInputStyle.Short, min_length: 6, max_length: 6, custom_id: `${this.data.name}.twofactor.ask.${id}.option.code`, placeholder: "XXXXXX", required: true, label: "Enter your Two Factor Authentication Code" }]}]});

			inProgress.set(id, { user: await getArgs(interaction, "user"), reason: await getArgs(interaction, "reason"), expiration: await getArgs(interaction, "duration") ?? undefined, references: await getArgs(interaction, "case_reference") ?? undefined });
		} else {
			await respond(interaction, CommandResponseType.Defer, { flags: MessageFlags.Ephemeral });
			await this.createPunishment({ interaction, api, options: { reason: await getArgs(interaction, "reason"), user: await getArgs(interaction, "user"), expiration: await getArgs(interaction, "duration") ?? undefined, references: await getArgs(interaction, "case_reference") ?? undefined}, respond });
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
		const expirationOption = options.expiration;
		const references = options.references ?? null;

		const member = await Result.fromAsync(async () => api.guilds.getMember(interaction.guild_id!, user.id));
		const guild = await api.guilds.get(interaction.guild_id!);

		if(member.isErr()) {
			const embed: APIEmbed = {
				title: "Cannot Create Punishment",
				description: "Sentry cannot find a user in the guild to apply the punishment to.",
				color: 0xff5c5c,
				timestamp: new Date(Date.now()).toISOString()
			};
	
			return void await respond(interaction, CommandResponseType.EditReply, { flags: MessageFlags.Ephemeral, embeds: [embed] });
		}

		const canBanUser = await PermissionsManager.canBanUser(member.unwrap(), guild, interaction.member!.user.id);

		if(!canBanUser) {
			const embed: APIEmbed = {
				title: "Cannot Create Punishment",
				description: "Sentry cannot create this punishment, this may be because\n🔹You are missing the requisite permissions\n🔹Sentry is lacking the correct permissions\n🔹You or Sentry are unable to punish the user due to role hierarchy or server ownership",
				color: 0xff5c5c,
				timestamp: new Date(Date.now()).toISOString()
			};

			return void await respond(interaction, CommandResponseType.EditReply, { flags: MessageFlags.Ephemeral, embeds: [embed] });
		}

		try {
			const time = ms(expirationOption);
			const timeDiff = new Date(Date.now() + time).getTime() - new Date(Date.now()).getTime();
			if((timeDiff / 86_400_000) >= 28) throw new Error("too long");
		} catch {
			const embed: APIEmbed = {
				title: "Invalid Expiration",
				description: "There was an invalid expiration duration provided. The duration you specify must be beneath 28 days due to discord restrictions.",
				color: 0xff5c5c,
				timestamp: new Date(Date.now()).toISOString()
			};

			return void await respond(interaction, CommandResponseType.EditReply, { flags: MessageFlags.Ephemeral, embeds: [embed] });
		}
		

		const expiration = ms(expirationOption);
			
		const punishment = await new ExpiringPunishment({ guildId: guild.id, moderatorId: interaction.member!.user.id, references, userId: member.unwrap().user!.id, reason, type: "Timeout", expires: new Date(Date.now() + expiration) }).build();

		if(punishment.isOk()) {
			const embed: APIEmbed = {
				title: "Punishment Created",
				color: 0x5cff9d,
				timestamp: new Date(Date.now()).toISOString()
			};

			return void await respond(interaction, CommandResponseType.EditReply, { flags: MessageFlags.Ephemeral, embeds: [embed] });
		} else {
			const embed: APIEmbed = {
				title: "Cannot Create Punishment",
				description: "Sentry cannot create this punishment, this may be because\n🔹You are missing the requisite permissions\n🔹Sentry is lacking the correct permissions\n🔹You or Sentry are unable to punish the user due to role hierarchy or server ownership",
				color: 0xff5c5c,
				timestamp: new Date(Date.now()).toISOString()
			};
	
			return void await respond(interaction, CommandResponseType.EditReply, { flags: MessageFlags.Ephemeral, embeds: [embed] });
		}
	}
}