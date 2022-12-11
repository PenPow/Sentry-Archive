import { type APIApplicationCommandOption, ApplicationCommandOptionType, ApplicationCommandType, RESTPostAPIChatInputApplicationCommandsJSONBody, type APIApplicationCommandSubcommandOption, type APIApplicationCommandInteractionDataSubcommandOption, type APIEmbed, MessageFlags } from "discord-api-types/v10";
import { TwoFactorAuthenticationManager } from "../../structures/2FAManager.js";
import * as SlashCommand from "../../structures/Command.js";

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
				title: "2FA Configured",
				description: `Please enter this secret into your authenticator app.\n**Secret:** ${secret}\n\nKeep this code safe! If you lose access to your authenticator app, this code allows you to reset your 2FA. We cannot manually reset 2FA codes without this code being shown.\n**Backup Code:** ${backup}`,
				color: 0x5cff9d,
				timestamp: new Date(Date.now()).toISOString()
			};

			return { embeds: [embed], flags: MessageFlags.Ephemeral };
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