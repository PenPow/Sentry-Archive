import { ApplicationCommandOptionType, ApplicationCommandType, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { translate } from "../../../common/translations/translate.js";
import { InteractionManager, ResponseType } from "../../managers/InteractionManager.js";
import { PunishmentManager } from "../../managers/PunishmentManager.js";
import { SettingsManager } from "../../managers/SettingsManager.js";

import { FunctionType, IFunction, PermissionTier } from "../../structures/Interaction.js";

const SettingsCommand: IFunction = {
	type: FunctionType.ChatInput,
	permissions: PermissionTier.Admin,
	async execute(interaction) {
		const [success, modal] = await PunishmentManager.handleUser2FA(interaction, interaction.user.id);

		if (!success) return;

		if (interaction.options.getSubcommand(true) === translate("en-GB", "SETTINGS_COMMAND_VIEW_SUBCOMMAND_NAME")) {
			const settings = await SettingsManager.getSettings(interaction.guildId);

			const embed = new EmbedBuilder()
				.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
				.setDescription([`${settings.automod ? "<:toggleon:1004668097476689950>" : "<:toggleoff:1004668148018069515>"} Auto Moderator\n`, `${settings.automod && settings.phrase ? "<:toggleon:1004668097476689950>" : "<:toggleoff:1004668148018069515>"} Malicious Phrase Detection`, `${settings.automod && settings.username ? "<:toggleon:1004668097476689950>" : "<:toggleoff:1004668148018069515>"} Malicious Username Detection`, `${settings.automod && settings.invite ? "<:toggleon:1004668097476689950>" : "<:toggleoff:1004668148018069515>"} Invite Detection and Blocking`, `${settings.automod && settings.url ? "<:toggleon:1004668097476689950>" : "<:toggleoff:1004668148018069515>"} Malicious URL Detection`, `${settings.automod && settings.spam ? "<:toggleon:1004668097476689950>" : "<:toggleoff:1004668148018069515>"} Anti Spam Protection`, `${settings.automod && settings.clamav ? "<:toggleon:1004668097476689950>" : "<:toggleoff:1004668148018069515>"} Anti Virus for Attachments`].join('\n'))
				.setTimestamp()
				.setColor(0x202225)
				.setTitle(`Settings`);

			return void await InteractionManager.sendInteractionResponse(modal ?? interaction, { ephemeral: true, embeds: [embed] }, ResponseType.Reply);
		}
		const settings = await SettingsManager.getSettings(interaction.guildId);

		if (interaction.options.getBoolean(translate("en-GB", "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_AUTOMOD_OPTION_NAME"), false) !== null) { settings.automod = interaction.options.getBoolean(translate("en-GB", "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_AUTOMOD_OPTION_NAME"), true); }
		if (interaction.options.getBoolean(translate("en-GB", "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_PHRASES_OPTION_NAME"), false) !== null) { settings.phrase = interaction.options.getBoolean(translate("en-GB", "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_PHRASES_OPTION_NAME"), true); }
		if (interaction.options.getBoolean(translate("en-GB", "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_USERNAME_OPTION_NAME"), false) !== null) { settings.username = interaction.options.getBoolean(translate("en-GB", "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_USERNAME_OPTION_NAME"), true); }
		if (interaction.options.getBoolean(translate("en-GB", "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_INVITE_OPTION_NAME"), false) !== null) { settings.invite = interaction.options.getBoolean(translate("en-GB", "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_INVITE_OPTION_NAME"), true); }
		if (interaction.options.getBoolean(translate("en-GB", "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_URL_OPTION_NAME"), false) !== null) { settings.url = interaction.options.getBoolean(translate("en-GB", "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_URL_OPTION_NAME"), true); }
		if (interaction.options.getBoolean(translate("en-GB", "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_SPAM_OPTION_NAME"), false) !== null) { settings.spam = interaction.options.getBoolean(translate("en-GB", "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_SPAM_OPTION_NAME"), true); }
		if (interaction.options.getBoolean(translate("en-GB", "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_ATTACHMENT_OPTION_NAME"), false) !== null) { settings.clamav = interaction.options.getBoolean(translate("en-GB", "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_ATTACHMENT_OPTION_NAME"), true); }

		await SettingsManager.setSettings(interaction.guildId, settings);

		const embed = new EmbedBuilder()
			.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
			.setTimestamp()
			.setDescription([`${settings.automod ? "<:toggleon:1004668097476689950>" : "<:toggleoff:1004668148018069515>"} Auto Moderator\n`, `${settings.automod && settings.phrase ? "<:toggleon:1004668097476689950>" : "<:toggleoff:1004668148018069515>"} Malicious Phrase Detection`, `${settings.automod && settings.username ? "<:toggleon:1004668097476689950>" : "<:toggleoff:1004668148018069515>"} Malicious Username Detection`, `${settings.automod && settings.invite ? "<:toggleon:1004668097476689950>" : "<:toggleoff:1004668148018069515>"} Invite Detection and Blocking`, `${settings.automod && settings.url ? "<:toggleon:1004668097476689950>" : "<:toggleoff:1004668148018069515>"} Malicious URL Detection`, `${settings.automod && settings.spam ? "<:toggleon:1004668097476689950>" : "<:toggleoff:1004668148018069515>"} Anti Spam Protection`, `${settings.automod && settings.clamav ? "<:toggleon:1004668097476689950>" : "<:toggleoff:1004668148018069515>"} Anti Virus for Attachments`].join('\n'))
			.setColor(0x202225)
			.setTitle(`Settings`);

		return void await InteractionManager.sendInteractionResponse(modal ?? interaction, { ephemeral: true, embeds: [embed] }, ResponseType.Reply);
	},
	toJSON() {
		return {
			name: "SETTINGS_COMMAND_NAME",
			description: "SETTINGS_COMMAND_DESCRIPTION",
			type: ApplicationCommandType.ChatInput,
			default_member_permissions: PermissionFlagsBits.Administrator.toString(),
			options: [{
				name: "SETTINGS_COMMAND_VIEW_SUBCOMMAND_NAME",
				description: "SETTINGS_COMMAND_VIEW_SUBCOMMAND_DESCRIPTION",
				type: ApplicationCommandOptionType.Subcommand,
			},
			{
				name: "SETTINGS_COMMAND_SET_SUBCOMMAND_NAME",
				description: "SETTINGS_COMMAND_SET_SUBCOMMAND_DESCRIPTION",
				type: ApplicationCommandOptionType.Subcommand,
				options: [{
					name: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_AUTOMOD_OPTION_NAME",
					description: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_AUTOMOD_OPTION_DESCRIPTION",
					type: ApplicationCommandOptionType.Boolean
				},
				{
					name: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_PHRASES_OPTION_NAME",
					description: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_PHRASES_OPTION_DESCRIPTION",
					type: ApplicationCommandOptionType.Boolean
				},
				{
					name: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_USERNAME_OPTION_NAME",
					description: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_USERNAME_OPTION_DESCRIPTION",
					type: ApplicationCommandOptionType.Boolean
				},
				{
					name: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_INVITE_OPTION_NAME",
					description: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_INVITE_OPTION_DESCRIPTION",
					type: ApplicationCommandOptionType.Boolean
				},
				{
					name: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_URL_OPTION_NAME",
					description: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_URL_OPTION_DESCRIPTION",
					type: ApplicationCommandOptionType.Boolean
				},
				{
					name: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_SPAM_OPTION_NAME",
					description: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_SPAM_OPTION_DESCRIPTION",
					type: ApplicationCommandOptionType.Boolean
				},
				{
					name: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_ATTACHMENT_OPTION_NAME",
					description: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_ATTACHMENT_OPTION_DESCRIPTION",
					type: ApplicationCommandOptionType.Boolean
				}]
			}]
		};
	}
};

export default SettingsCommand;
