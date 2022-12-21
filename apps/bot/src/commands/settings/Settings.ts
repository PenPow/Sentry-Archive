import type { Result } from "@sapphire/result";
import { type APIApplicationCommandOption, ApplicationCommandOptionType, ApplicationCommandType, RESTPostAPIChatInputApplicationCommandsJSONBody, type APIApplicationCommandChannelOption, ChannelType, type APIEmbed, MessageFlags, type APIChatInputApplicationCommandInteraction, type APIModalSubmitInteraction, type Snowflake, ComponentType, TextInputStyle, type APIApplicationCommandSubcommandOption, type APIApplicationCommandInteractionDataSubcommandOption, PermissionFlagsBits } from "discord-api-types/v10";
import { nanoid } from "nanoid";
import { Prisma } from "../../db.js";
import { TwoFactorAuthenticationManager } from "../../structures/2FAManager.js";
import * as SlashCommand from "../../structures/Command.js";
import { Punishment } from "../../structures/Punishment.js";
import { CommandResponseType, type DataType, type ValidDataTypes } from "../../utils/helpers.js";

type LoggingOptions = { channelId: Snowflake };
type TwoFactorOptions = { enforce: boolean };
type FreezeOptions = { freeze: boolean };
type ScanningOptions = { av?: boolean, phishertools?: boolean };
const inProgress: Map<string, LoggingOptions | TwoFactorOptions | FreezeOptions | ScanningOptions> = new Map();

export default class SettingsCommand extends SlashCommand.Handler<ApplicationCommandType.ChatInput> {
	public override data = {
		name: 'settings',
		description: 'Modify your server settings',
		type: ApplicationCommandType.ChatInput,
		dm_permission: false,
		default_member_permissions: PermissionFlagsBits.Administrator.toString(10), 
	} satisfies Omit<RESTPostAPIChatInputApplicationCommandsJSONBody, "options"> & { type: ApplicationCommandType.ChatInput; };

	public override options = {
		"logs": {
			type: ApplicationCommandOptionType.Subcommand,
			description: "Modify the logging channels",
			options: [
				{
					name: "audit-channel",
					type: ApplicationCommandOptionType.Channel,
					description: "Where should I send my logs to (recommended to keep the same for compatability reasons)",
					channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
					required: true
				} as Omit<APIApplicationCommandChannelOption, "name">
			]
		} as Omit<APIApplicationCommandSubcommandOption, "name">,
		"2fa": {
			type: ApplicationCommandOptionType.Subcommand,
			description: "Adjust settings regarding 2FA",
			options: [
				{
					name: "enforce-for-moderation",
					type: ApplicationCommandOptionType.Boolean,
					description: "Should Sentry enforce 2FA for moderation",
					required: true
				}
			]
		} as Omit<APIApplicationCommandSubcommandOption, "name">,
		"punishments": {
			type: ApplicationCommandOptionType.Subcommand,
			description: "Adjust settings regarding punishments",
			options: [
				{
					name: "auto-freeze",
					type: ApplicationCommandOptionType.Boolean,
					description: "Should Sentry automatically freeze punishments?",
					required: true
				}
			]
		} as Omit<APIApplicationCommandSubcommandOption, "name">,
		"scanning": {
			type: ApplicationCommandOptionType.Subcommand,
			description: "Adjust settings related to the anti virus and our phishing domains database",
			options: [
				{
					name: "enable-av",
					type: ApplicationCommandOptionType.Boolean,
					description: "Should Sentry scan attachments with our anti-virus",
					required: false
				},
				{
					name: "enable-phishertools",
					type: ApplicationCommandOptionType.Boolean,
					description: "Should Sentry scan domains with our phishing domains database.",
					required: false
				}
			]
		} as Omit<APIApplicationCommandSubcommandOption, "name">
	} satisfies { [ string: string ]: Omit<APIApplicationCommandOption, "name"> };

	public override async execute({ interaction, respond, api }: SlashCommand.RunContext<SettingsCommand>): SlashCommand.Returnable {
		if(!interaction.data.options) return;

		const subcommand = interaction.data.options.find((option) => option.type === ApplicationCommandOptionType.Subcommand) as APIApplicationCommandInteractionDataSubcommandOption | undefined;
		if(!subcommand) return;

		if(subcommand.name === "logs") {
			const channel = interaction.data.resolved?.channels![subcommand.options!.find((option) => option.name === "audit-channel")!.value as string];
			if(!channel) return;

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

				inProgress.set(id, { channelId: channel.id });
			} else {
				await this.editLogging({ interaction, options: { channelId: channel.id }, respond });
			}
		} else if(subcommand.name === "2fa") {
			const enforce = subcommand.options!.find((option) => option.name === "enforce-for-moderation")!.value as boolean;

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

				inProgress.set(id, { enforce });
			} else {
				await this.edit2FA({ interaction, options: { enforce }, respond });
			}
		} else if(subcommand.name === "punishments") {
			const freeze = subcommand.options!.find((option) => option.name === "auto-freeze")!.value as boolean;

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

				inProgress.set(id, { freeze });
			} else {
				await this.freezePunishments({ interaction, options: { freeze }, respond });
			}
		} else if(subcommand.name === "scanning") {
			const av = subcommand.options!.find((option) => option.name === "enable-av")!.value as boolean | undefined;
			const phishertools = subcommand.options!.find((option) => option.name === "enable-phishertools")!.value as boolean | undefined;

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

				inProgress.set(id, { av, phishertools });
			} else {
				await this.modifyScanning({ interaction, options: { av, phishertools }, respond });
			}
		}
	}

	public override async handleModal({ interaction, respond }: Omit<SlashCommand.RunContext<any>, "getArgs" | "interaction"> & { interaction: APIModalSubmitInteraction; }): Promise<void> {
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
		if(!data) return;

		if("channelId" in data) await this.editLogging({ interaction, options: data!, respond });
		else if("enforce" in data) await this.edit2FA({ interaction, options: data!, respond });
		else if("freeze" in data) await this.freezePunishments({ interaction, options: data!, respond });
		else if("av" in data) await this.modifyScanning({ interaction, options: data!, respond });
	}

	private async editLogging({ interaction, options, respond }: { interaction: APIChatInputApplicationCommandInteraction | APIModalSubmitInteraction, options: LoggingOptions, respond(interaction: APIChatInputApplicationCommandInteraction | APIModalSubmitInteraction, responseType: ValidDataTypes<APIChatInputApplicationCommandInteraction | APIModalSubmitInteraction>, data: DataType<ValidDataTypes<APIChatInputApplicationCommandInteraction | APIModalSubmitInteraction>>): Promise<Result<true, Error>>}) {
		await Punishment.createUserAndGuild(interaction.member!.user.id, interaction.guild_id!);

		await Prisma.guild.update({ where: { id: interaction.guild_id! }, data: { modLogChannelId: options.channelId }});

		const embed: APIEmbed = {
			title: "Updated Settings",
			description: "⚠️ Editing of previous cases is supported, however prior messages will not be updated.",
			color: 0x5cff9d,
			timestamp: new Date(Date.now()).toISOString()
		};

		return void await respond(interaction, CommandResponseType.Reply, { flags: MessageFlags.Ephemeral, embeds: [embed] });
	}

	private async edit2FA({ interaction, options, respond }: { interaction: APIChatInputApplicationCommandInteraction | APIModalSubmitInteraction, options: TwoFactorOptions, respond(interaction: APIChatInputApplicationCommandInteraction | APIModalSubmitInteraction, responseType: ValidDataTypes<APIChatInputApplicationCommandInteraction | APIModalSubmitInteraction>, data: DataType<ValidDataTypes<APIChatInputApplicationCommandInteraction | APIModalSubmitInteraction>>): Promise<Result<true, Error>>}) {
		await Punishment.createUserAndGuild(interaction.member!.user.id, interaction.guild_id!);

		await Prisma.guild.update({ where: { id: interaction.guild_id! }, data: { enforce2FA: options.enforce }});

		const embed: APIEmbed = {
			title: "Updated Settings",
			color: 0x5cff9d,
			timestamp: new Date(Date.now()).toISOString()
		};

		return void await respond(interaction, CommandResponseType.Reply, { flags: MessageFlags.Ephemeral, embeds: [embed] });
	}

	private async freezePunishments({ interaction, options, respond }: { interaction: APIChatInputApplicationCommandInteraction | APIModalSubmitInteraction, options: FreezeOptions, respond(interaction: APIChatInputApplicationCommandInteraction | APIModalSubmitInteraction, responseType: ValidDataTypes<APIChatInputApplicationCommandInteraction | APIModalSubmitInteraction>, data: DataType<ValidDataTypes<APIChatInputApplicationCommandInteraction | APIModalSubmitInteraction>>): Promise<Result<true, Error>>}) {
		await Punishment.createUserAndGuild(interaction.member!.user.id, interaction.guild_id!);

		await Prisma.guild.update({ where: { id: interaction.guild_id! }, data: { freezePunishments: options.freeze }});

		const embed: APIEmbed = {
			title: "Updated Settings",
			color: 0x5cff9d,
			timestamp: new Date(Date.now()).toISOString()
		};

		return void await respond(interaction, CommandResponseType.Reply, { flags: MessageFlags.Ephemeral, embeds: [embed] });
	}

	private async modifyScanning({ interaction, options, respond }: { interaction: APIChatInputApplicationCommandInteraction | APIModalSubmitInteraction, options: ScanningOptions, respond(interaction: APIChatInputApplicationCommandInteraction | APIModalSubmitInteraction, responseType: ValidDataTypes<APIChatInputApplicationCommandInteraction | APIModalSubmitInteraction>, data: DataType<ValidDataTypes<APIChatInputApplicationCommandInteraction | APIModalSubmitInteraction>>): Promise<Result<true, Error>>}) {
		await Punishment.createUserAndGuild(interaction.member!.user.id, interaction.guild_id!);

		const settings: { av?: boolean, phishertools?: boolean } = {}
		if(options.av === true || options.av === false) settings.av = options.av
		else if(options.phishertools === true || options.phishertools === false) settings.phishertools = options.av

		await Prisma.guild.update({ where: { id: interaction.guild_id! }, data: settings });

		const embed: APIEmbed = {
			title: "Updated Settings",
			color: 0x5cff9d,
			timestamp: new Date(Date.now()).toISOString()
		};

		return void await respond(interaction, CommandResponseType.Reply, { flags: MessageFlags.Ephemeral, embeds: [embed] });
	}
}