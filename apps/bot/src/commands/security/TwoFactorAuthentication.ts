import { type APIApplicationCommandOption, ApplicationCommandOptionType, ApplicationCommandType, RESTPostAPIChatInputApplicationCommandsJSONBody, type APIApplicationCommandSubcommandOption, type APIApplicationCommandInteractionDataSubcommandOption, type APIEmbed, MessageFlags, APIMessageComponentInteraction, ComponentType, ButtonStyle, APIModalSubmitInteraction, TextInputStyle } from "discord-api-types/v10";
import { nanoid } from "nanoid";
import { Prisma } from "../../db.js";
import { TwoFactorAuthenticationManager } from "../../structures/2FAManager.js";
import * as SlashCommand from "../../structures/Command.js";
import { CommandResponseType } from "../../utils/helpers.js";

type Options = { secret: string, backup_code: string };
const inProgress: Map<string, Options> = new Map();

export default class TwoFactorAuthenticationCommand extends SlashCommand.Handler<ApplicationCommandType.ChatInput> {
	public override data = {
		name: '2fa',
		description: 'Configure 2FA Settings',
		type: ApplicationCommandType.ChatInput
	} satisfies Omit<RESTPostAPIChatInputApplicationCommandsJSONBody, "options"> & { type: ApplicationCommandType.ChatInput; };

	public override options = {
		"setup": {
			type: ApplicationCommandOptionType.Subcommand,
			description: 'Enable 2FA on your account'
		},
		"remove": {
			type: ApplicationCommandOptionType.Subcommand,
			description: 'Remove/Disable 2FA from your account',
			options: [{
				name: "token",
				description: "Your current 2FA token or one of your backup codes",
				required: true,
				type: ApplicationCommandOptionType.String,
			}]
		} as Omit<APIApplicationCommandSubcommandOption, "name">
	} satisfies { [ string: string ]: Omit<APIApplicationCommandOption, "name"> };

	public override async handleComponent({ interaction, respond }: Omit<SlashCommand.RunContext<any>, "getArgs" | "interaction"> & { interaction: APIMessageComponentInteraction; }): Promise<void> {
		const id = interaction.data.custom_id.split('.')[3];
		
		await respond(interaction, CommandResponseType.Modal, { custom_id: `${this.data.name}.twofactor.ask.${id}`, title: 'Verify 2FA', components: [{ type: ComponentType.ActionRow, components: [{ type: ComponentType.TextInput, style: TextInputStyle.Short, min_length: 6, max_length: 6, custom_id: `${this.data.name}.twofactor.ask.${id}.option.code`, placeholder: "XXXXXX", required: true, label: "Enter your Two Factor Authentication Code" }]}]});
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

		await respond(interaction, CommandResponseType.Defer, { flags: MessageFlags.Ephemeral });

		const { secret, backup_code } = inProgress.get(interaction.data.custom_id.split('.')[3]!)!;
		
		await Prisma.user.update({
			where: { id: interaction.member!.user.id },
			data: { 
				twofactor_secret: secret,
				backup_code
			}
		});

		const embed: APIEmbed = {
			title: "2FA Setup Complete",
			description: `We have validated your 2FA code and setup 2FA for your account.`,
			color: 0x5cff9d,
			timestamp: new Date(Date.now()).toISOString()
		};

		await inProgress.delete(interaction.data.custom_id.split('.')[3]!)

		return void await respond(interaction, CommandResponseType.EditReply, { embeds: [embed], flags: MessageFlags.Ephemeral});
	}

	public override async execute({ interaction }: SlashCommand.RunContext<TwoFactorAuthenticationCommand>): SlashCommand.Returnable {
		if(!interaction.data.options) return;

		const subcommand = interaction.data.options.find((option) => option.type === ApplicationCommandOptionType.Subcommand) as APIApplicationCommandInteractionDataSubcommandOption | undefined;
		if(!subcommand) return;

		const user = interaction.guild_id ? interaction.member!.user : interaction.user!;

		if(subcommand.name === "setup") {
			if(await TwoFactorAuthenticationManager.has2FAEnabled(user.id)) {
				const embed: APIEmbed = {
					title: "🚨 2FA is Already Configured",
					description: "Please remove your 2FA settings and configure it again!",
					color: 0xff5c5c,
					timestamp: new Date(Date.now()).toISOString()
				};

				return { embeds: [embed], flags: MessageFlags.Ephemeral };
			}

			const { secret, backup } = await TwoFactorAuthenticationManager.createUser2FA(user.id);

			const embed: APIEmbed = {
				title: "2FA Setup in Progress",
				description: `Please enter this secret into your authenticator app.\n**Secret:** ${secret}\n\nKeep this code safe! If you lose access to your authenticator app, this code allows you to reset your 2FA. We cannot manually reset 2FA codes without this code being shown.\n**Backup Code:** ${backup}\n\nPress the button to verify your 2FA code.`,
				color: 0x5cff9d,
				timestamp: new Date(Date.now()).toISOString()
			};
			
			const id = nanoid();

			inProgress.set(id, { secret, backup_code: backup });

			return { embeds: [embed], flags: MessageFlags.Ephemeral, components: [{ type: ComponentType.ActionRow, components: [{ type: ComponentType.Button, style: ButtonStyle.Primary, custom_id: `${this.data.name}.twofactor.setup.${id}.continue`, label: "Finish Setup" }]}] };
		} else if(subcommand.name === "remove") {
			if(!(await TwoFactorAuthenticationManager.has2FAEnabled(user.id))) {
				const embed: APIEmbed = {
					title: "🚨 2FA is Not Configured",
					description: "Please setup 2FA",
					color: 0xff5c5c,
					timestamp: new Date(Date.now()).toISOString()
				};

				return { embeds: [embed], flags: MessageFlags.Ephemeral };
			}

			const token = subcommand.options!.find((option) => option.name === "token");
			if(!token || typeof token.value !== "string") return;

			const verified2FA = await TwoFactorAuthenticationManager.verifyUser2FA(user.id, token.value, true);
			if(!verified2FA) {
				const embed: APIEmbed = {
					title: "🚨 Failed to Verify 2FA Token",
					description: "Please double check your 2FA token, or use a backup code if you do not have access to your authenticator app.",
					color: 0xff5c5c,
					timestamp: new Date(Date.now()).toISOString()
				};

				return { embeds: [embed], flags: MessageFlags.Ephemeral };
			}

			await TwoFactorAuthenticationManager.removeUser2FA(user.id);

			const embed: APIEmbed = {
				title: "2FA Removed",
				color: 0x5cff9d,
				timestamp: new Date(Date.now()).toISOString()
			};

			return { embeds: [embed], flags: MessageFlags.Ephemeral };
		}
	}
}