import { ApplicationCommandOptionType, ApplicationCommandType, ChannelType, EmbedBuilder, Locale, PermissionFlagsBits } from "discord.js";
import { translate, translationKeys } from "../../../common/translations/translate.js";
import { InteractionManager, ResponseType } from "../../managers/InteractionManager.js";
import { PunishmentManager } from "../../managers/PunishmentManager.js";
import { SettingsManager } from "../../managers/SettingsManager.js";

import { FunctionType, IFunction, PermissionTier } from "../../structures/Interaction.js";

const SettingsCommand: IFunction = {
	type: FunctionType.ChatInput,
	permissions: PermissionTier.Admin,
	async execute(interaction) {
		if (!interaction.inCachedGuild()) return void await InteractionManager.sendInteractionResponse(interaction, { content: translate(interaction.locale, "GUILD_ONLY") }, ResponseType.Reply);

		const [success, modal] = await PunishmentManager.handleUser2FA(interaction, interaction.user.id);

		if (!success) return;

		if (interaction.options.getSubcommand(true) === translate(Locale.EnglishGB, "SETTINGS_COMMAND_VIEW_SUBCOMMAND_NAME")) {
			const settings = await SettingsManager.getSettings(interaction.guildId);

			let prettyLanguage: translationKeys = "SETTINGS_COMMAND_EMBED_LANGUAGE_UNKNOWN_NAME";

			// eslint-disable-next-line no-negated-condition
			switch (![Locale.EnglishGB, Locale.EnglishUS].includes(settings.language as Locale | null ?? Locale.EnglishGB) ? settings.language as Locale : interaction.guildLocale) {
				case Locale.Danish:
					prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_DANISH_CHOICE_NAME";
					break;
				case Locale.German:
					prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_GERMAN_CHOICE_NAME";
					break;
				case Locale.SpanishES:
					prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_SPANISH_CHOICE_NAME";
					break;
				case Locale.French:
					prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_FRENCH_CHOICE_NAME";
					break;
				case Locale.Croatian:
					prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_CROATIAN_CHOICE_NAME";
					break;
				case Locale.Italian:
					prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_ITALIAN_CHOICE_NAME";
					break;
				case Locale.Lithuanian:
					prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_LITHUANIAN_CHOICE_NAME";
					break;
				case Locale.Hungarian:
					prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_HUNGARIAN_CHOICE_NAME";
					break;
				case Locale.Dutch:
					prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_DUTCH_CHOICE_NAME";
					break;
				case Locale.Norwegian:
					prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_NORWEGIAN_CHOICE_NAME";
					break;
				case Locale.Polish:
					prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_POLISH_CHOICE_NAME";
					break;
				case Locale.PortugueseBR:
					prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_PORTUGUESE_CHOICE_NAME";
					break;
				case Locale.Romanian:
					prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_ROMANIAN_CHOICE_NAME";
					break;
				case Locale.Finnish:
					prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_FINNISH_CHOICE_NAME";
					break;
				case Locale.Swedish:
					prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_SWEDISH_CHOICE_NAME";
					break;
				case Locale.Turkish:
					prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_TURKISH_CHOICE_NAME";
					break;
				case Locale.Czech:
					prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_CZECH_CHOICE_NAME";
					break;
				case Locale.Greek:
					prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_GREEK_CHOICE_NAME";
					break;
				case Locale.Bulgarian:
					prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_BULGARIAN_CHOICE_NAME";
					break;
				case Locale.Russian:
					prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_RUSSIAN_CHOICE_NAME";
					break;
				case Locale.Ukrainian:
					prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_UKRANIAN_CHOICE_NAME";
					break;
				case Locale.ChineseCN:
					prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_CHINESE_CHOICE_NAME";
					break;
				case Locale.Japanese:
					prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_JAPANESE_CHOICE_NAME";
					break;
				case Locale.Korean:
					prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_KOREAN_CHOICE_NAME";
					break;
				case Locale.EnglishGB:
				case Locale.EnglishUS:
				default:
					prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_ENGLISH_CHOICE_NAME";
					break;
			}

			const embed = new EmbedBuilder()
				.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
				.setDescription(translate(interaction.locale, "SETTINGS_EMBED_DESCRIPTION", settings, interaction.guild.mfaLevel, translate(interaction.locale, prettyLanguage)))
				.setTimestamp()
				.setColor(0x202225)
				.setTitle(translate(interaction.locale, "SETTINGS_EMBED_TITLE"));

			return void await InteractionManager.sendInteractionResponse(modal ?? interaction, { ephemeral: true, embeds: [embed] }, ResponseType.Reply);
		}
		const settings = await SettingsManager.getSettings(interaction.guildId);

		if (interaction.options.getBoolean(translate(Locale.EnglishGB, "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_AUTOMOD_OPTION_NAME"), false) !== null) { settings.automod = interaction.options.getBoolean(translate(Locale.EnglishGB, "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_AUTOMOD_OPTION_NAME"), true); }
		if (interaction.options.getBoolean(translate(Locale.EnglishGB, "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_PHRASES_OPTION_NAME"), false) !== null) { settings.phrase = interaction.options.getBoolean(translate(Locale.EnglishGB, "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_PHRASES_OPTION_NAME"), true); }
		if (interaction.options.getBoolean(translate(Locale.EnglishGB, "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_USERNAME_OPTION_NAME"), false) !== null) { settings.username = interaction.options.getBoolean(translate(Locale.EnglishGB, "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_USERNAME_OPTION_NAME"), true); }
		if (interaction.options.getBoolean(translate(Locale.EnglishGB, "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_INVITE_OPTION_NAME"), false) !== null) { settings.invite = interaction.options.getBoolean(translate(Locale.EnglishGB, "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_INVITE_OPTION_NAME"), true); }
		if (interaction.options.getBoolean(translate(Locale.EnglishGB, "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_URL_OPTION_NAME"), false) !== null) { settings.url = interaction.options.getBoolean(translate(Locale.EnglishGB, "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_URL_OPTION_NAME"), true); }
		if (interaction.options.getBoolean(translate(Locale.EnglishGB, "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_SPAM_OPTION_NAME"), false) !== null) { settings.spam = interaction.options.getBoolean(translate(Locale.EnglishGB, "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_SPAM_OPTION_NAME"), true); }
		if (interaction.options.getBoolean(translate(Locale.EnglishGB, "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_ATTACHMENT_OPTION_NAME"), false) !== null) { settings.clamav = interaction.options.getBoolean(translate(Locale.EnglishGB, "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_ATTACHMENT_OPTION_NAME"), true); }
		if (interaction.options.getBoolean(translate(Locale.EnglishGB, "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_2FA_OPTION_NAME"), false) !== null) { settings.enforce2fa = interaction.options.getBoolean(translate(Locale.EnglishGB, "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_2FA_OPTION_NAME"), true); }
		if (interaction.options.getBoolean(translate(Locale.EnglishGB, "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_STATS_OPTION_NAME"), false) !== null) { settings.statistics = interaction.options.getBoolean(translate(Locale.EnglishGB, "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_STATS_OPTION_NAME"), true); }
		if (interaction.options.getChannel(translate(Locale.EnglishGB, "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LOGS_OPTION_NAME"), false) !== null) { settings.logChannelId = interaction.options.getChannel(translate(Locale.EnglishGB, "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LOGS_OPTION_NAME"), true).id; }
		if (interaction.options.getString(translate(Locale.EnglishGB, "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_NAME"), false) !== null) { settings.language = interaction.options.getString(translate(Locale.EnglishGB, "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_NAME"), true); }

		let prettyLanguage: translationKeys = "SETTINGS_COMMAND_EMBED_LANGUAGE_UNKNOWN_NAME";

		// eslint-disable-next-line no-negated-condition
		switch (![Locale.EnglishGB, Locale.EnglishUS].includes(settings.language as Locale | null ?? Locale.EnglishGB) ? settings.language as Locale : interaction.guildLocale) {
			case Locale.Danish:
				prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_DANISH_CHOICE_NAME";
				break;
			case Locale.German:
				prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_GERMAN_CHOICE_NAME";
				break;
			case Locale.SpanishES:
				prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_SPANISH_CHOICE_NAME";
				break;
			case Locale.French:
				prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_FRENCH_CHOICE_NAME";
				break;
			case Locale.Croatian:
				prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_CROATIAN_CHOICE_NAME";
				break;
			case Locale.Italian:
				prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_ITALIAN_CHOICE_NAME";
				break;
			case Locale.Lithuanian:
				prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_LITHUANIAN_CHOICE_NAME";
				break;
			case Locale.Hungarian:
				prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_HUNGARIAN_CHOICE_NAME";
				break;
			case Locale.Dutch:
				prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_DUTCH_CHOICE_NAME";
				break;
			case Locale.Norwegian:
				prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_NORWEGIAN_CHOICE_NAME";
				break;
			case Locale.Polish:
				prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_POLISH_CHOICE_NAME";
				break;
			case Locale.PortugueseBR:
				prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_PORTUGUESE_CHOICE_NAME";
				break;
			case Locale.Romanian:
				prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_ROMANIAN_CHOICE_NAME";
				break;
			case Locale.Finnish:
				prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_FINNISH_CHOICE_NAME";
				break;
			case Locale.Swedish:
				prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_SWEDISH_CHOICE_NAME";
				break;
			case Locale.Turkish:
				prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_TURKISH_CHOICE_NAME";
				break;
			case Locale.Czech:
				prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_CZECH_CHOICE_NAME";
				break;
			case Locale.Greek:
				prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_GREEK_CHOICE_NAME";
				break;
			case Locale.Bulgarian:
				prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_BULGARIAN_CHOICE_NAME";
				break;
			case Locale.Russian:
				prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_RUSSIAN_CHOICE_NAME";
				break;
			case Locale.Ukrainian:
				prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_UKRANIAN_CHOICE_NAME";
				break;
			case Locale.ChineseCN:
				prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_CHINESE_CHOICE_NAME";
				break;
			case Locale.Japanese:
				prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_JAPANESE_CHOICE_NAME";
				break;
			case Locale.Korean:
				prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_KOREAN_CHOICE_NAME";
				break;
			case Locale.EnglishGB:
			case Locale.EnglishUS:
			default:
				prettyLanguage = "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_ENGLISH_CHOICE_NAME";
				break;
		}

		await SettingsManager.setSettings(interaction.guildId, settings);

		const embed = new EmbedBuilder()
			.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
			.setDescription(translate(interaction.locale, "SETTINGS_EMBED_DESCRIPTION", settings, interaction.guild.mfaLevel, translate(interaction.locale, prettyLanguage)))
			.setTimestamp()
			.setColor(0x202225)
			.setTitle(translate(interaction.locale, "SETTINGS_EMBED_TITLE"));

		return void await InteractionManager.sendInteractionResponse(modal ?? interaction, { ephemeral: true, embeds: [embed] }, ResponseType.Reply);
	},
	toJSON() {
		return {
			name: "SETTINGS_COMMAND_NAME",
			description: "SETTINGS_COMMAND_DESCRIPTION",
			type: ApplicationCommandType.ChatInput,
			dm_permission: false,
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
				},
				{
					name: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_2FA_OPTION_NAME",
					description: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_2FA_OPTION_DESCRIPTION",
					type: ApplicationCommandOptionType.Boolean
				},
				{
					name: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_STATS_OPTION_NAME",
					description: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_STATS_OPTION_DESCRIPTION",
					type: ApplicationCommandOptionType.Boolean
				},
				{
					name: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LOGS_OPTION_NAME",
					description: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LOGS_OPTION_DESCRIPTION",
					type: ApplicationCommandOptionType.Channel,
					channel_types: [ChannelType.GuildText],
				},
				{
					name: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_NAME",
					description: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_DESCRIPTION",
					type: ApplicationCommandOptionType.String,
					choices: [{ name: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_DANISH_CHOICE_NAME", value: "da" }, { name: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_GERMAN_CHOICE_NAME", value: "de" }, { name: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_ENGLISH_CHOICE_NAME", value: "en-GB" }, { name: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_SPANISH_CHOICE_NAME", value: "es-ES" }, { name: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_FRENCH_CHOICE_NAME", value: "fr" }, { name: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_CROATIAN_CHOICE_NAME", value: "hr" }, { name: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_ITALIAN_CHOICE_NAME", value: "it" }, { name: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_LITHUANIAN_CHOICE_NAME", value: "lt" }, { name: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_HUNGARIAN_CHOICE_NAME", value: "hu" }, { name: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_DUTCH_CHOICE_NAME", value: "nl" }, { name: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_NORWEGIAN_CHOICE_NAME", value: "no" }, { name: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_POLISH_CHOICE_NAME", value: "pl" }, { name: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_PORTUGUESE_CHOICE_NAME", value: "pt-BR" }, { name: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_ROMANIAN_CHOICE_NAME", value: "ro" }, { name: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_FINNISH_CHOICE_NAME", value: "fi" }, { name: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_SWEDISH_CHOICE_NAME", value: "sv-SE" }, { name: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_TURKISH_CHOICE_NAME", value: "tr" }, { name: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_CZECH_CHOICE_NAME", value: "cs" }, { name: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_GREEK_CHOICE_NAME", value: "el" }, { name: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_BULGARIAN_CHOICE_NAME", value: "bg" }, { name: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_RUSSIAN_CHOICE_NAME", value: "ru" }, { name: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_UKRANIAN_CHOICE_NAME", value: "uk" }, { name: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_CHINESE_CHOICE_NAME", value: "zh-CN" }, { name: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_JAPANESE_CHOICE_NAME", value: "jp" }, { name: "SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_KOREAN_CHOICE_NAME", value: "ko" }],
				}]
			}]
		};
	}
};

export default SettingsCommand;
