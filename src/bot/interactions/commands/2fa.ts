import speakeasy from "@levminer/speakeasy";
import * as Sentry from "@sentry/node";
import { ActionRowBuilder, APIButtonComponentWithCustomId, ApplicationCommandOptionType, ApplicationCommandType, AttachmentBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder, InteractionResponse, Message, ModalBuilder, ModalSubmitInteraction, TextInputBuilder, TextInputStyle } from "discord.js";
import { nanoid } from "nanoid";
import { toBuffer } from "qrcode";
import { redis } from "../../../common/db.js";
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
			let modalSubmit: ModalSubmitInteraction | void;
			if (user.secret) {
				const customId = `ignore-${nanoid()}-modal`;
				const textId = `${nanoid()}-text`;

				await interaction.showModal(new ModalBuilder().setTitle(translate(interaction.locale, "TWOFACTORAUTHENTICATION_VERIFICATION_MODAL_TITLE")).setCustomId(customId)
					.addComponents(...[new ActionRowBuilder<TextInputBuilder>().addComponents(...[new TextInputBuilder().setCustomId(textId).setLabel(translate(interaction.locale, "TWOFACTORAUTHENTICATION_VERIFICATION_MODAL_FIELD"))
						.setMinLength(6)
						.setRequired(true)
						.setStyle(TextInputStyle.Short)])]));

				modalSubmit = await interaction.awaitModalSubmit({ time: 600000, filter: i => i.customId === customId && i.user.id === interaction.user.id }).catch(async () => {
					const cancelled = new EmbedBuilder()
						.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
						.setTimestamp()
						.setColor(0xFF5C5C)
						.setTitle(translate(interaction.locale, "CANCELLED"));

					void await InteractionManager.sendInteractionResponse(interaction, { ephemeral: true, embeds: [cancelled], components: [], files: [] }, ResponseType.Reply);
				});

				if (!modalSubmit) return;

				try {
					if (user.backup !== modalSubmit.fields.getTextInputValue(textId) && !speakeasy.totp.verify({ secret: user.secret, token: modalSubmit.fields.getTextInputValue(textId), digits: modalSubmit.fields.getTextInputValue(textId).length, encoding: "base32" })) {
						const embed = new EmbedBuilder()
							.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
							.setTimestamp()
							.setColor(0xFF5C5C)
							.setDescription(translate(interaction.locale, "TWOFACTORAUTHENTICATION_FAILED_TO_VERIFY_DESCRIPTION"))
							.setTitle(translate(interaction.locale, "TWOFACTORAUTHENTICATION_FAILED_TO_VERIFY_TITLE"));

						return void await InteractionManager.sendInteractionResponse(modalSubmit, { ephemeral: true, embeds: [embed], components: [], files: [] }, ResponseType.Reply);
					}
				} catch {
					const embed = new EmbedBuilder()
						.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
						.setTimestamp()
						.setColor(0xFF5C5C)
						.setDescription(translate(interaction.locale, "TWOFACTORAUTHENTICATION_FAILED_TO_VERIFY_DESCRIPTION"))
						.setTitle(translate(interaction.locale, "TWOFACTORAUTHENTICATION_FAILED_TO_VERIFY_TITLE"));

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
				.setDescription(translate(interaction.locale, "TWOFACTORAUTHENTICATION_SETUP_EMBED_DESCRIPTION", secret.base32))
				.setTitle(translate(interaction.locale, "TWOFACTORAUTHENTICATION_SETUP_EMBED_TITLE"));

			const declined_id = `ignore-${nanoid()}-2fa-decline`;
			const row =	new ActionRowBuilder<ButtonBuilder>().addComponents(...[
				new ButtonBuilder().setCustomId(`ignore-${nanoid()}-2fa-accept`)
					.setStyle(ButtonStyle.Primary)
					.setLabel(translate(interaction.locale, "CONTINUE")),
				new ButtonBuilder().setCustomId(declined_id).setEmoji('❌')
					.setStyle(ButtonStyle.Secondary)
					.setLabel(translate(interaction.locale, "CANCEL"))
			]);

			const response = await InteractionManager.sendInteractionResponse(user.secret ? modalSubmit! : interaction, { ephemeral: true, embeds: [embed], components: [row], files: [attachment], fetchReply: true }, ResponseType.Reply);

			if (response.isErr()) {
				Sentry.captureException(response.unwrapErr());
				return;
			}

			const unwrapped = response.unwrap() as InteractionResponse | Message;

			const int = await unwrapped.awaitMessageComponent({ componentType: ComponentType.Button, time: 600000, filter: i => [(row.components[0].toJSON() as APIButtonComponentWithCustomId).custom_id, (row.components[1].toJSON() as APIButtonComponentWithCustomId).custom_id].includes(i.customId) && i.user.id === interaction.user.id }).catch(async () => {
				const cancelled = new EmbedBuilder()
					.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
					.setTimestamp()
					.setColor(0xFF5C5C)
					.setTitle(translate(interaction.locale, "CANCELLED"));

				void await InteractionManager.sendInteractionResponse(interaction, { ephemeral: true, embeds: [cancelled], components: [], files: [] }, ResponseType.FollowUp);
			});

			if (int) {
				if (int.customId === declined_id) {
					const cancelled = new EmbedBuilder()
						.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
						.setTimestamp()
						.setColor(0xFF5C5C)
						.setTitle(translate(interaction.locale, "CANCELLED"));

					return void await InteractionManager.sendInteractionResponse(int, { ephemeral: true, embeds: [cancelled], components: [], files: [] }, ResponseType.Update);
				}
				const customId = `ignore-${nanoid()}-modal`;
				const textId = `${nanoid()}-text`;
				await int.showModal(new ModalBuilder().setTitle(translate(interaction.locale, "TWOFACTORAUTHENTICATION_VERIFICATION_MODAL_TITLE")).setCustomId(customId)
					.addComponents(...[new ActionRowBuilder<TextInputBuilder>().addComponents(...[new TextInputBuilder().setCustomId(textId).setLabel(translate(interaction.locale, "TWOFACTORAUTHENTICATION_SETUP_MODAL_FIELD"))
						.setMinLength(6)
						.setMaxLength(8)
						.setRequired(true)
						.setStyle(TextInputStyle.Short)])]));

				const modalSubmit = await int.awaitModalSubmit({ time: 600000, filter: i => i.customId === customId && i.user.id === interaction.user.id }).catch(async () => {
					const cancelled = new EmbedBuilder()
						.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
						.setTimestamp()
						.setColor(0xFF5C5C)
						.setTitle(translate(interaction.locale, "CANCELLED"));

					void await InteractionManager.sendInteractionResponse(int, { ephemeral: true, embeds: [cancelled], components: [], files: [] }, ResponseType.Update);
				});

				if (!modalSubmit) return;

				try {
					if (!speakeasy.totp.verify({ secret: secret.base32, token: modalSubmit.fields.getTextInputValue(textId), digits: modalSubmit.fields.getTextInputValue(textId).length, encoding: "base32" })) {
						const embed = new EmbedBuilder()
							.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
							.setTimestamp()
							.setColor(0xFF5C5C)
							.setDescription(translate(interaction.locale, "TWOFACTORAUTHENTICATION_SETUP_FAILED_VERIFICATION_EMBED_DESCRIPTION"))
							.setTitle(translate(interaction.locale, "TWOFACTORAUTHENTICATION_FAILED_TO_VERIFY_TITLE"));

						return void await InteractionManager.sendInteractionResponse(modalSubmit, { ephemeral: true, embeds: [embed], components: [], files: [] }, ResponseType.Update);
					}
				} catch {
					const embed = new EmbedBuilder()
						.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
						.setTimestamp()
						.setColor(0xFF5C5C)
						.setDescription(translate(interaction.locale, "TWOFACTORAUTHENTICATION_SETUP_FAILED_VERIFICATION_EMBED_DESCRIPTION"))
						.setTitle(translate(interaction.locale, "TWOFACTORAUTHENTICATION_FAILED_TO_VERIFY_TITLE"));

					return void await InteractionManager.sendInteractionResponse(modalSubmit, { ephemeral: true, embeds: [embed], components: [], files: [] }, ResponseType.Update);
				}

				const backup = speakeasy.generateSecret({ length: 20 }).base32;

				const embed = new EmbedBuilder()
					.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
					.setTimestamp()
					.setColor(0x202225)
					.setDescription(translate(interaction.locale, "TWOFACTORAUTHENTICATION_SETUP_COMPLETE_EMBED_DESCRIPTION", backup))
					.setTitle(`2FA Setup Complete`);

				await SettingsManager.setUserSettings(interaction.user.id, { secret: secret.base32, backup });
				await redis.incr(`users-2fa`);

				void await InteractionManager.sendInteractionResponse(modalSubmit, { ephemeral: true, embeds: [embed], components: [], files: [] }, ResponseType.Update);
			}
		} else {
			if (!user.secret) {
				const embed = new EmbedBuilder()
					.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
					.setTimestamp()
					.setColor(0xFF5C5C)
					.setDescription(translate(interaction.locale, "TWOFACTORAUTHENTICATION_NOT_CONFIGURED_EMBED_DESCRIPTION"))
					.setTitle(translate(interaction.locale, "TWOFACTORAUTHENTICATION_NOT_CONFIGURED_EMBED_TITLE"));

				return void await InteractionManager.sendInteractionResponse(interaction, { ephemeral: true, embeds: [embed], components: [], files: [] }, ResponseType.Reply);
			}

			try {
				if (user.backup !== interaction.options.getString(translate("en-GB", "TWOFACTORAUTHENTICATION_COMMAND_DISABLE_SUBCOMMAND_TOKEN_OPTION_NAME"), true) && !speakeasy.totp.verify({ secret: user.secret, token: interaction.options.getString(translate("en-GB", "TWOFACTORAUTHENTICATION_COMMAND_DISABLE_SUBCOMMAND_TOKEN_OPTION_NAME"), true), digits: interaction.options.getString(translate("en-GB", "TWOFACTORAUTHENTICATION_COMMAND_DISABLE_SUBCOMMAND_TOKEN_OPTION_NAME"), true).length, encoding: "base32" })) {
					const embed = new EmbedBuilder()
						.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
						.setTimestamp()
						.setColor(0xFF5C5C)
						.setDescription(translate(interaction.locale, "TWOFACTORAUTHENTICATION_FAILED_TO_VERIFY_DESCRIPTION"))
						.setTitle(translate(interaction.locale, "TWOFACTORAUTHENTICATION_FAILED_TO_VERIFY_TITLE"));

					return void await InteractionManager.sendInteractionResponse(interaction, { ephemeral: true, embeds: [embed], components: [], files: [] }, ResponseType.Reply);
				}
			} catch {
				const embed = new EmbedBuilder()
					.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
					.setTimestamp()
					.setColor(0xFF5C5C)
					.setDescription(translate(interaction.locale, "TWOFACTORAUTHENTICATION_FAILED_TO_VERIFY_DESCRIPTION"))
					.setTitle(translate(interaction.locale, "TWOFACTORAUTHENTICATION_FAILED_TO_VERIFY_TITLE"));

				return void await InteractionManager.sendInteractionResponse(interaction, { ephemeral: true, embeds: [embed], components: [], files: [] }, ResponseType.Reply);
			}

			const embed = new EmbedBuilder()
				.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
				.setTimestamp()
				.setColor(0x202225)
				.setTitle(translate(interaction.locale, "TWOFACTORAUTHENTICATION_DISABLED_EMBED_TITLE"));

			await SettingsManager.setUserSettings(interaction.user.id, { secret: null, backup: null });
			await redis.decr(`users-2fa`);
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
