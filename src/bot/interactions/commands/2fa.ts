import speakeasy from "@levminer/speakeasy";
import { ActionRowBuilder, APIButtonComponentWithCustomId, ApplicationCommandOptionType, ApplicationCommandType, AttachmentBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder, InteractionResponse, Message, ModalBuilder, ModalSubmitInteraction, TextInputBuilder, TextInputStyle } from "discord.js";
import { nanoid } from "nanoid";
import { toBuffer } from "qrcode";
import { translate } from "../../../common/translations/translate.js";
import { InteractionManager, ResponseType } from "../../managers/InteractionManager.js";
import { SettingsManager } from "../../managers/SettingsManager.js";
import { FunctionType, IFunction, PermissionTier } from "../../structures/Interaction.js";

const TwoFactorAuthenticationCommand: IFunction = {
	type: FunctionType.ChatInput,
	permissions: PermissionTier.User,
	async execute(interaction) {
		const user = await SettingsManager.getUserSettings(interaction.user.id);

		if (interaction.options.getSubcommand(true) === translate("en-GB", "TWOFACTORAUTHENTICATION_COMMAND_CONFIGURE_SUBCOMMAND_NAME")) {
			let modalSubmit: ModalSubmitInteraction<"cached"> | void;
			if (user.secret) {
				const customId = `ignore-${nanoid()}-modal`;
				const textId = `${nanoid()}-text`;

				await interaction.showModal(new ModalBuilder().setTitle('Verify Identity').setCustomId(customId)
					.addComponents(...[new ActionRowBuilder<TextInputBuilder>().addComponents(...[new TextInputBuilder().setCustomId(textId).setLabel('2FA Code or Backup Code')
						.setMinLength(6)
						.setRequired(true)
						.setStyle(TextInputStyle.Short)])]));

				modalSubmit = await interaction.awaitModalSubmit({ time: 600000, filter: i => i.customId === customId && i.user.id === interaction.user.id }).catch(async () => {
					const cancelled = new EmbedBuilder()
						.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
						.setTimestamp()
						.setColor(0xFF5C5C)
						.setTitle(`❌ Cancelled`);

					void await InteractionManager.sendInteractionResponse(interaction, { ephemeral: true, embeds: [cancelled], components: [], files: [] }, ResponseType.Reply);
				});

				if (!modalSubmit) return;

				try {
					if (user.backup !== modalSubmit.fields.getTextInputValue(textId) && !speakeasy.totp.verify({ secret: user.secret, token: modalSubmit.fields.getTextInputValue(textId), digits: modalSubmit.fields.getTextInputValue(textId).length, encoding: "base32" })) {
						const embed = new EmbedBuilder()
							.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
							.setTimestamp()
							.setColor(0xFF5C5C)
							.setDescription("<:point:995372986179780758> Make sure the code hasn't expired!")
							.setTitle(`Failed to Verify 2FA Token`);

						return void await InteractionManager.sendInteractionResponse(modalSubmit, { ephemeral: true, embeds: [embed], components: [], files: [] }, ResponseType.Reply);
					}
				} catch {
					const embed = new EmbedBuilder()
						.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
						.setTimestamp()
						.setColor(0xFF5C5C)
						.setDescription("<:point:995372986179780758> Make sure the code hasn't expired!")
						.setTitle(`Failed to Verify 2FA Token`);

					return void await InteractionManager.sendInteractionResponse(modalSubmit, { ephemeral: true, embeds: [embed], components: [], files: [] }, ResponseType.Reply);
				}
			}

			const secret = speakeasy.generateSecret({ length: 20 });

			const attachment = new AttachmentBuilder(await toBuffer(speakeasy.otpauthURL({ secret: secret.base32, encoding: 'base32', label: 'Sentry Discord Bot', issuer: 'Sentry' }), { errorCorrectionLevel: 'H', margin: 1 })).setName("qrcode.png");

			const embed = new EmbedBuilder()
				.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
				.setTimestamp()
				.setColor(0x202225)
				.setImage("attachment://qrcode.png")
				.setDescription(["<:point:995372986179780758> Install [Google Authenticator](https://support.google.com/accounts/answer/1066447?hl=en&co=GENIE.Platform%3DAndroid&oco=0), [Authy](https://authy.com), or an authenticator application", "<:point:995372986179780758> Scan the QR code or manually input the code", "<:point:995372986179780758> Once your 2FA application is setup, press continue!", `\n<:point:995372986179780758> **Code:** ${secret.base32}`, `\n> ⚠️ Keep your account safe! Phishing attacks will often use these codes to gain access to your account. If in doubt, enter the code above instead of scanning the QR code.`].join('\n'))
				.setTitle(`Generated 2FA Code`);

			const declined_id = `ignore-${nanoid()}-2fa-decline`;
			const row =	new ActionRowBuilder<ButtonBuilder>().addComponents(...[
				new ButtonBuilder().setCustomId(`ignore-${nanoid()}-2fa-accept`)
					.setStyle(ButtonStyle.Primary)
					.setLabel('Continue'),
				new ButtonBuilder().setCustomId(declined_id).setEmoji('❌')
					.setStyle(ButtonStyle.Secondary)
					.setLabel('Cancel')
			]);

			const response = await InteractionManager.sendInteractionResponse(user.secret ? modalSubmit! : interaction, { ephemeral: true, embeds: [embed], components: [row], files: [attachment], fetchReply: true }, ResponseType.Reply);

			if (!response.isOk()) return;

			const unwrapped = response.unwrap() as InteractionResponse | Message;

			const int = await unwrapped.awaitMessageComponent({ componentType: ComponentType.Button, time: 600000, filter: i => [(row.components[0].toJSON() as APIButtonComponentWithCustomId).custom_id, (row.components[1].toJSON() as APIButtonComponentWithCustomId).custom_id].includes(i.customId) && i.user.id === interaction.user.id }).catch(async () => {
				const cancelled = new EmbedBuilder()
					.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
					.setTimestamp()
					.setColor(0xFF5C5C)
					.setTitle(`❌ Cancelled`);

				void await InteractionManager.sendInteractionResponse(interaction, { ephemeral: true, embeds: [cancelled], components: [], files: [] }, ResponseType.FollowUp);
			});

			if (int) {
				if (int.customId === declined_id) {
					const cancelled = new EmbedBuilder()
						.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
						.setTimestamp()
						.setColor(0xFF5C5C)
						.setTitle(`❌ Cancelled`);

					return void await InteractionManager.sendInteractionResponse(int, { ephemeral: true, embeds: [cancelled], components: [], files: [] }, ResponseType.Update);
				}
				const customId = `ignore-${nanoid()}-modal`;
				const textId = `${nanoid()}-text`;
				await int.showModal(new ModalBuilder().setTitle('2FA Setup').setCustomId(customId)
					.addComponents(...[new ActionRowBuilder<TextInputBuilder>().addComponents(...[new TextInputBuilder().setCustomId(textId).setLabel('Enter 2FA Token from your Authenticator App')
						.setMinLength(6)
						.setMaxLength(8)
						.setRequired(true)
						.setStyle(TextInputStyle.Short)])]));

				const modalSubmit = await int.awaitModalSubmit({ time: 600000, filter: i => i.customId === customId && i.user.id === interaction.user.id }).catch(async () => {
					const cancelled = new EmbedBuilder()
						.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
						.setTimestamp()
						.setColor(0xFF5C5C)
						.setTitle(`❌ Cancelled`);

					void await InteractionManager.sendInteractionResponse(int, { ephemeral: true, embeds: [cancelled], components: [], files: [] }, ResponseType.Update);
				});

				if (!modalSubmit) return;

				try {
					if (!speakeasy.totp.verify({ secret: secret.base32, token: modalSubmit.fields.getTextInputValue(textId), digits: modalSubmit.fields.getTextInputValue(textId).length, encoding: "base32" })) {
						const embed = new EmbedBuilder()
							.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
							.setTimestamp()
							.setColor(0xFF5C5C)
							.setDescription("<:point:995372986179780758> Run this command again! A common issue is the code expiring, make sure that you send the code before the timer reaches 0.")
							.setTitle(`Failed to Verify 2FA Token`);

						return void await InteractionManager.sendInteractionResponse(modalSubmit, { ephemeral: true, embeds: [embed], components: [], files: [] }, ResponseType.Update);
					}
				} catch {
					const embed = new EmbedBuilder()
						.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
						.setTimestamp()
						.setColor(0xFF5C5C)
						.setDescription("<:point:995372986179780758> Run this command again! A common issue is the code expiring, make sure that you send the code before the timer reaches 0.")
						.setTitle(`Failed to Verify 2FA Token`);

					return void await InteractionManager.sendInteractionResponse(modalSubmit, { ephemeral: true, embeds: [embed], components: [], files: [] }, ResponseType.Update);
				}

				const backup = speakeasy.generateSecret({ length: 20 }).base32;

				const embed = new EmbedBuilder()
					.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
					.setTimestamp()
					.setColor(0x202225)
					.setDescription(["<:point:995372986179780758> 2FA is now enabled globally on your account!", "<:point:995372986179780758> You will be prompted to enter this code upon a protected action", "\n> ⚠️ Please keep this backup code safe, it can be used to access your account and reconfigure 2FA. If you lose access to your authenticator, run /2fa again, and when prompted, enter a backup code, it will walk you through reconfiguring 2FA with your new authenticator.\n", `<:point:995372986179780758> ${backup}`].join('\n'))
					.setTitle(`2FA Setup Complete`);

				await SettingsManager.setUserSettings(interaction.user.id, { secret: secret.base32, backup });

				void await InteractionManager.sendInteractionResponse(modalSubmit, { ephemeral: true, embeds: [embed], components: [], files: [] }, ResponseType.Update);
			}
		} else {
			if (!user.secret) {
				const embed = new EmbedBuilder()
					.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
					.setTimestamp()
					.setColor(0xFF5C5C)
					.setDescription("<:point:995372986179780758> You do not have 2FA enabled on your account, set it up with /2fa configure")
					.setTitle(`2FA Not Configured`);

				return void await InteractionManager.sendInteractionResponse(interaction, { ephemeral: true, embeds: [embed], components: [], files: [] }, ResponseType.Reply);
			}

			try {
				if (user.backup !== interaction.options.getString(translate("en-GB", "TWOFACTORAUTHENTICATION_COMMAND_DISABLE_SUBCOMMAND_TOKEN_OPTION_NAME"), true) && !speakeasy.totp.verify({ secret: user.secret, token: interaction.options.getString("TWOFACTORAUTHENTICATION_COMMAND_DISABLE_SUBCOMMAND_TOKEN_OPTION_NAME", true), digits: interaction.options.getString("TWOFACTORAUTHENTICATION_COMMAND_DISABLE_SUBCOMMAND_TOKEN_OPTION_NAME", true).length, encoding: "base32" })) {
					const embed = new EmbedBuilder()
						.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
						.setTimestamp()
						.setColor(0xFF5C5C)
						.setDescription("<:point:995372986179780758> Make sure the code hasn't expired!")
						.setTitle(`Failed to Verify 2FA Token`);

					return void await InteractionManager.sendInteractionResponse(interaction, { ephemeral: true, embeds: [embed], components: [], files: [] }, ResponseType.Reply);
				}
			} catch {
				const embed = new EmbedBuilder()
					.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
					.setTimestamp()
					.setColor(0xFF5C5C)
					.setDescription("<:point:995372986179780758> Make sure the code hasn't expired!")
					.setTitle(`Failed to Verify 2FA Token`);

				return void await InteractionManager.sendInteractionResponse(interaction, { ephemeral: true, embeds: [embed], components: [], files: [] }, ResponseType.Reply);
			}

			const embed = new EmbedBuilder()
				.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
				.setTimestamp()
				.setColor(0x202225)
				.setTitle(`✅ Disabled 2FA`);

			await SettingsManager.setUserSettings(interaction.user.id, { secret: null, backup: null });
			return void await InteractionManager.sendInteractionResponse(interaction, { ephemeral: true, embeds: [embed], components: [], files: [] }, ResponseType.Reply);
		}

		// eslint-disable-next-line no-useless-return
		return;
	},
	toJSON() {
		return {
			name: "TWOFACTORAUTHENTICATION_COMMAND_NAME",
			description: "TWOFACTORAUTHENTICATION_COMMAND_DESCRIPTION",
			type: ApplicationCommandType.ChatInput,
			options: [{
				name: "TWOFACTORAUTHENTICATION_COMMAND_CONFIGURE_SUBCOMMAND_NAME",
				description: "TWOFACTORAUTHENTICATION_COMMAND_CONFIGURE_SUBCOMMAND_DESCRIPTION",
				type: ApplicationCommandOptionType.Subcommand
			},
			{
				name: "TWOFACTORAUTHENTICATION_COMMAND_DISABLE_SUBCOMMAND_NAME",
				description: "TWOFACTORAUTHENTICATION_COMMAND_DISABLE_SUBCOMMAND_DESCRIPTION",
				type: ApplicationCommandOptionType.Subcommand,
				options: [{
					name: "TWOFACTORAUTHENTICATION_COMMAND_DISABLE_SUBCOMMAND_TOKEN_OPTION_NAME",
					description: "TWOFACTORAUTHENTICATION_COMMAND_DISABLE_SUBCOMMAND_TOKEN_OPTION_DESCRIPTION",
					required: true,
					type: ApplicationCommandOptionType.String,
				}]
			}]
		};
	},
};

export default TwoFactorAuthenticationCommand;
