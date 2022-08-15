import { Punishment, PunishmentType, Settings } from "@prisma/client";
import { GuildBan, GuildMFALevel, Snowflake, User } from "discord.js";

const english = {

	// MISC
	COMMAND_INTERNAL_ERROR: "An error occurred while loading and running this command, please wait a minute and try again.",
	GUILD_ONLY: "This command is limited to being ran in a guild!",
	NO_PERMISSIONS_TITLE: "No Permission",
	NO_PERMISSIONS_DESCRIPTION: 'You cannot use this command',
	AN_ERROR_OCCURRED: "❌ An Error Occurred",
	CONTINUE: 'Continue',
	CANCEL: 'Cancel',

	// AUTO MODERATION
	RAPID_MESSAGE_POSTING_AUTOMOD_REASON: "Rapid Message Posting",
	SUSPICIOUS_USERNAME_AUTOMOD_REASON: "Suspicious Username",
	MALICIOUS_PHRASE_AUTOMOD_REASON: "Malicious Phrase Detected",
	INVITE_AUTOMOD_REASON: "Invite Detected",
	MASS_MENTIONS_AUTOMOD_REASON: "Mass Mentions",
	MALICIOUS_DOMAIN_AUTOMOD_REASON: "Malicious Domain Detected",
	AV_AUTOMOD_REASON: "Malicious File Uploaded",
	HEAT_SYSTEM_PUNISHMENT_REASON: (reason: string, heat: number) => `${reason} (${Math.round(heat)} Heat)`,

	// EVAL COMMAND
	EVAL_COMMAND_NAME: "eval",
	EVAL_COMMAND_DESCRIPTION: "oops, i forgot to remove this",
	EVAL_COMMAND_SOURCE_OPTION_NAME: "sourcebin",
	EVAL_COMMAND_SOURCE_OPTION_DESCRIPTION: "link to sourcebin",

	// GENERAL MODERATION COMMANDS
	MODERATION_DEFAULT_REASON: 'No Reason Specified',
	MODERATION_TARGET_OPTION_NAME: "user",
	MODERATION_TARGET_OPTION_DESCRIPTION: "User to punish",
	MODERATION_REASON_OPTION_NAME: "reason",
	MODERATION_REASON_OPTION_DESCRIPTION: "Note to add to punishment",
	MODERATION_REFERENCE_OPTION_NAME: "reference",
	MODERATION_REFERENCE_OPTION_DESCRIPTION: "Reference another case in this punishment!",
	MANUAL_PUNISHMENT: "Manual Punishment",
	CANNOT_PUNISH_USER: "❌ Cannot Punish User",
	CANCELLED: "❌ Cancelled",
	NO_LOG_CHANNEL: "❌ Cannot Find Log Channel",
	NO_LOG_MESSAGE: "❌ Cannot Find Log Message",
	PUNISHMENT_PROMPT_TITLE: (tag: string) => `Are you sure you want to punish ${tag}`,
	PUNISHMENT_PROMPT_DESCRIPTION: (punishments: Punishment[]) => [`<:point:995372986179780758> **${punishments.filter(punishment => punishment.type === PunishmentType.Ban).length}** Ban${punishments.filter(punishment => punishment.type === PunishmentType.Ban).length === 1 ? '' : 's'}`, `**${punishments.filter(punishment => punishment.type === PunishmentType.Softban).length}** Softban${punishments.filter(punishment => punishment.type === PunishmentType.Softban).length === 1 ? '' : 's'}`, `**${punishments.filter(punishment => punishment.type === PunishmentType.Kick).length}** Kick${punishments.filter(punishment => punishment.type === PunishmentType.Kick).length === 1 ? '' : 's'}`, `**${punishments.filter(punishment => punishment.type === PunishmentType.Timeout).length}** Timeout${punishments.filter(punishment => punishment.type === PunishmentType.Timeout).length === 1 ? '' : 's'}`, `**${punishments.filter(punishment => punishment.type === PunishmentType.Warn).length}** Warn${punishments.filter(punishment => punishment.type === PunishmentType.Warn).length === 1 ? '' : 's'}`].join('\n <:point:995372986179780758> '),
	PUNISHMENT_PROMPT_BUTTON_YES: "Punish",
	PUNISHMENT_PROMPT_BUTTON_NO: "Cancel",
	SENTRY_MODERATION_DESCRIPTION: (user: User, data: Omit<Punishment, 'id' | 'createdAt' | 'modLogID' | 'modLogChannelID'>, ref?: Punishment) => [`<:point:995372986179780758> **Member:** ${user.tag} (${user.id})`, `<:point:995372986179780758> **Action:** ${data.type} ${data.type === PunishmentType.Timeout && data.expires ? `(<t:${Math.round(data.expires.getTime() / 1000)}:R>)` : ""}`, `<:point:995372986179780758> **Reason:** ${data.reason.substring(0, 900)}`, ref && `<:point:995372986179780758> **Reference:** [#${data.caseID}](https://discord.com/channels/${ref.guildID}/${ref.modLogChannelID!}/${ref.modLogID!})`].join("\n"),
	DISCORD_MODERATION_DESCRIPTION: (ban: GuildBan, action: PunishmentType, reason: string) => [`<:point:995372986179780758> **Member:** ${ban.user.tag} ${ban.user.id})`, `<:point:995372986179780758> **Action:** ${action}`, `<:point:995372986179780758> **Reason:** ${reason}`].join("\n"),

	// BAN COMMAND
	BAN_COMMAND_NAME: "ban",
	BAN_COMMAND_DESCRIPTION: "Remove troublemakers from your server",

	// UNBAN COMMAND
	UNBAN_COMMAND_NAME: "unban",
	UNBAN_COMMAND_DESCRIPTION: "Let them back in",
	UNBAN_MEMBER_OPTION_DESCRIPTION: "Enter their user ID here",
	CANNOT_UNBAN_USER: "❌ Cannot Unban User",

	// KICK COMMAND
	KICK_COMMAND_NAME: "kick",
	KICK_COMMAND_DESCRIPTION: "Remove a user from your server",

	// SOFTBAN COMMAND
	SOFTBAN_COMMAND_NAME: "softban",
	SOFTBAN_COMMAND_DESCRIPTION: "Kick a user and remove their messages! Best of both worlds.",
	SOFTBAN_UNBAN_REASON: "User was softbanned",

	// TIMEOUT COMMAND
	TIMEOUT_COMMAND_NAME: "timeout",
	TIMEOUT_COMMAND_DESCRIPTION: "Ssssh a user",
	TIMEOUT_DURATION_OPTION_NAME: "duration",
	TIMEOUT_DURATION_OPTION_DESCRIPTION: "Number of hours to timeout for",

	// WARN COMMAND
	WARN_COMMAND_NAME: "warn",
	WARN_COMMAND_DESCRIPTION: "Thats an infraction! Slap them on the wrist",

	// SLOWMODE COMMAND
	SLOWMODE_COMMAND_NAME: "slowmode",
	SLOWMODE_COMMAND_DESCRIPTION: "Slow this party down",
	SLOWMODE_DURATION_OPTION_DESCRIPTION: "Number of seconds to set slowmode to",
	CANNOT_MODIFY_SLOWMODE: "❌ Cannot Modify Slowmode",
	SLOWMODE_LOG_EMBED_DESCRIPTION: (delay: string, channel: Snowflake, reason: string) => [`<:point:995372986179780758> **Channel:** <#${channel}>`, `<:point:995372986179780758> **Action:** Slowmode`, `<:point:995372986179780758> **Delay**: ${delay}`, `<:point:995372986179780758> **Reason:** ${reason}`].join("\n"),
	SLOWMODE_FOOTER: "Slowmode",

	// REASON COMMAND
	REASON_COMMAND_NAME: "reason",
	REASON_COMMAND_DESCRIPTION: "Modify the reason of a case",
	REASON_CASE_OPTION_NAME: "case",
	REASON_CASE_OPTION_DESCRIPTION: "What case are we talking about?",
	REASON_NEWREASON_OPTION_NAME: "reason",
	REASON_NEWREASON_OPTION_DESCRIPTION: "Whats the new reason",
	REASON_EMBED_NEW_REASON: (reason: string) => `<:point:995372986179780758> **Reason:** ${reason}`,

	// CASE COMMAND
	CASE_COMMAND_NAME: "case",
	CASE_COMMAND_DESCRIPTION: "Lookup a case",
	CASE_EMBED_TITLE: "❌ Cannot Find Case",

	// HISTORY COMMAND
	HISTORY_COMMAND_NAME: "history",
	HISTORY_COMMAND_DESCRIPTION: "Lookup a users history",
	HISTORY_COMMAND_USER_OPTION_DESCRIPTION: "User to lookup",
	HISTORY_CONTEXT_NAME: "Moderation History",
	HISTORY_PAGE_NUMBER: (page: number, total: number) => `Page ${page}/${total}`,
	HISTORY_EMBED_TITLE_1: (tag: string) => `User History for ${tag}`,
	HISTORY_EMBED_TITLE_OTHER: (caseid: number) => `Case #${caseid}`,
	HISTORY_EMBED_DESCRIPTION: (tag: string, id: Snowflake, action: PunishmentType, reason: string, expires: string) => [`<:point:995372986179780758> **Member:** ${tag} (${id})`, `<:point:995372986179780758> **Action:** ${action} ${expires}`, `<:point:995372986179780758> **Reason:** ${reason}`].join("\n"),

	// SETTINGS COMMAND
	SETTINGS_COMMAND_NAME: "settings",
	SETTINGS_COMMAND_DESCRIPTION: "Configure Sentry",
	SETTINGS_EMBED_TITLE: "Settings",
	SETTINGS_EMBED_DESCRIPTION: (settings: Settings, mfaLevel: GuildMFALevel, prettyLanguage = "🇬🇧 English") => [`${settings.automod ? "<:toggleon:1004668097476689950>" : "<:toggleoff:1004668148018069515>"} Auto Moderator\n`, `${settings.automod && settings.phrase ? "<:toggleon:1004668097476689950>" : "<:toggleoff:1004668148018069515>"} Malicious Phrase Detection`, `${settings.automod && settings.username ? "<:toggleon:1004668097476689950>" : "<:toggleoff:1004668148018069515>"} Malicious Username Detection`, `${settings.automod && settings.invite ? "<:toggleon:1004668097476689950>" : "<:toggleoff:1004668148018069515>"} Invite Detection and Blocking`, `${settings.automod && settings.url ? "<:toggleon:1004668097476689950>" : "<:toggleoff:1004668148018069515>"} Malicious URL Detection`, `${settings.automod && settings.spam ? "<:toggleon:1004668097476689950>" : "<:toggleoff:1004668148018069515>"} Anti Spam Protection`, `${settings.automod && settings.clamav ? "<:toggleon:1004668097476689950>" : "<:toggleoff:1004668148018069515>"} Anti Virus for Attachments\n`, `${mfaLevel === GuildMFALevel.Elevated || settings.enforce2fa ? "<:toggleon:1004668097476689950>" : "<:toggleoff:1004668148018069515>"} **Enforce 2FA for Moderators**`, `${settings.statistics ? "<:toggleon:1004668097476689950>" : "<:toggleoff:1004668148018069515>"} **Statistic Collection**\n`, `<:point:995372986179780758> **Log Channel**: ${settings.logChannelId ? `<#${settings.logChannelId}>` : 'Not Set'}`, `<:point:995372986179780758> **Guild Language**: ${prettyLanguage}`].join('\n'),
	SETTINGS_COMMAND_VIEW_SUBCOMMAND_NAME: "view",
	SETTINGS_COMMAND_VIEW_SUBCOMMAND_DESCRIPTION: "View your settings",
	SETTINGS_COMMAND_SET_SUBCOMMAND_NAME: "edit",
	SETTINGS_COMMAND_SET_SUBCOMMAND_DESCRIPTION: "Set your settings",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_AUTOMOD_OPTION_NAME: "automod",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_AUTOMOD_OPTION_DESCRIPTION: "Toggle the whole automoderator unit",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_PHRASES_OPTION_NAME: "phrase",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_PHRASES_OPTION_DESCRIPTION: "Toggle Malicious Phrase Detection",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_USERNAME_OPTION_NAME: "username",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_USERNAME_OPTION_DESCRIPTION: "Toggle Malicious Username Detection",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_INVITE_OPTION_NAME: "invite",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_INVITE_OPTION_DESCRIPTION: "Toggle Invites",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_URL_OPTION_NAME: "url",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_URL_OPTION_DESCRIPTION: "Toggle Malicious URL Detection",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_SPAM_OPTION_NAME: "spam",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_SPAM_OPTION_DESCRIPTION: "Toggle Anti Spam Protection",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_ATTACHMENT_OPTION_NAME: "antivirus",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_ATTACHMENT_OPTION_DESCRIPTION: "Toggle Attachment Anti Virus",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_2FA_OPTION_NAME: "enforce-2fa",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_2FA_OPTION_DESCRIPTION: "Require moderators have 2FA enabled",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_STATS_OPTION_NAME: "statistics",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_STATS_OPTION_DESCRIPTION: "Collect Anonymous Statistics",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LOGS_OPTION_NAME: "logs",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LOGS_OPTION_DESCRIPTION: "Where should I send my logs to?",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_NAME: "language",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_DESCRIPTION: "Im multi lingual",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_DANISH_CHOICE_NAME: "🇩🇰 Danish",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_GERMAN_CHOICE_NAME: "🇩🇪 German",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_ENGLISH_CHOICE_NAME: "🇬🇧 English",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_SPANISH_CHOICE_NAME: "🇪🇸 Spanish",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_FRENCH_CHOICE_NAME: "🇫🇷 French",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_CROATIAN_CHOICE_NAME: "🇭🇷 Croatian",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_ITALIAN_CHOICE_NAME: "🇮🇹 Italian",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_LITHUANIAN_CHOICE_NAME: "🇱🇹 Lithuanian",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_HUNGARIAN_CHOICE_NAME: "🇭🇺 Hungarian",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_DUTCH_CHOICE_NAME: "🇳🇱 Dutch",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_NORWEGIAN_CHOICE_NAME: "🇳🇴 Norwegian",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_POLISH_CHOICE_NAME: "🇵🇱 Polish",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_PORTUGUESE_CHOICE_NAME: "🇵🇹 Portuguese",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_ROMANIAN_CHOICE_NAME: "🇷🇴 Romanian",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_FINNISH_CHOICE_NAME: "🇫🇮 Finnish",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_SWEDISH_CHOICE_NAME: "🇸🇪 Swedish",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_TURKISH_CHOICE_NAME: "🇹🇷 Turkey",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_CZECH_CHOICE_NAME: "🇨🇿 Czech",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_GREEK_CHOICE_NAME: "🇬🇷 Greek",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_BULGARIAN_CHOICE_NAME: "🇧🇬 Bulgarian",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_RUSSIAN_CHOICE_NAME: "🇷🇺 Russian",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_UKRANIAN_CHOICE_NAME: "🇺🇦 Ukranian",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_CHINESE_CHOICE_NAME: "🇨🇳 Chinese",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_JAPANESE_CHOICE_NAME: "🇯🇵 Japanese",
	SETTINGS_COMMAND_SET_SUBCOMMAND_SETTING_OPTION_LANGUAGE_OPTION_KOREAN_CHOICE_NAME: "🇰🇷 Korean",
	SETTINGS_COMMAND_EMBED_LANGUAGE_UNKNOWN_NAME: "❔ Unknown",

	// 2FA COMMAND
	TWOFACTORAUTHENTICATION_COMMAND_NAME: "2fa",
	TWOFACTORAUTHENTICATION_COMMAND_DESCRIPTION: "Looking for enhanced security on your personal account, setup 2FA here - 2FA is applied globally",
	TWOFACTORAUTHENTICATION_COMMAND_CONFIGURE_SUBCOMMAND_NAME: "configure",
	TWOFACTORAUTHENTICATION_COMMAND_CONFIGURE_SUBCOMMAND_DESCRIPTION: "Enable or reconfigure 2FA",
	TWOFACTORAUTHENTICATION_COMMAND_DISABLE_SUBCOMMAND_NAME: "disable",
	TWOFACTORAUTHENTICATION_COMMAND_DISABLE_SUBCOMMAND_DESCRIPTION: "Disable 2FA",
	TWOFACTORAUTHENTICATION_COMMAND_DISABLE_SUBCOMMAND_TOKEN_OPTION_NAME: "code",
	TWOFACTORAUTHENTICATION_COMMAND_DISABLE_SUBCOMMAND_TOKEN_OPTION_DESCRIPTION: "Your 2FA code or backup code",
	TWOFACTORAUTHENTICATION_PROMPT_EMBED_TITLE: "Please Enable 2FA",
	TWOFACTORAUTHENTICATION_PROMPT_EMBED_DESCRIPTION: "<:point:995372986179780758> This guild requires 2FA for moderation access, please setup 2FA to run this command.\n\n> Dont want this enabled? Modify it with /settings, and make sure 2FA requirement for moderation is disabled in Server Settings > Safety Setup",
	TWOFACTORAUTHENTICATION_FAILED_TO_VERIFY_TITLE: "Failed to Verify 2FA Token",
	TWOFACTORAUTHENTICATION_FAILED_TO_VERIFY_DESCRIPTION: "<:point:995372986179780758> Make sure the code hasn't expired!",
	TWOFACTORAUTHENTICATION_VERIFICATION_MODAL_TITLE: "Verify Identity",
	TWOFACTORAUTHENTICATION_VERIFICATION_MODAL_FIELD: "2FA Code or Backup Code",
	TWOFACTORAUTHENTICATION_SETUP_MODAL_FIELD: "Enter 2FA Token from your Authenticator App",
	TWOFACTORAUTHENTICATION_SETUP_EMBED_TITLE: "Generated 2FA Code",
	TWOFACTORAUTHENTICATION_SETUP_FAILED_VERIFICATION_EMBED_DESCRIPTION: "<:point:995372986179780758> Run this command again! A common issue is the code expiring, make sure that you send the code before the timer reaches 0.",
	TWOFACTORAUTHENTICATION_SETUP_EMBED_DESCRIPTION: (secret: string) => ["<:point:995372986179780758> Install [Google Authenticator](https://support.google.com/accounts/answer/1066447?hl=en&co=GENIE.Platform%3DAndroid&oco=0), [Authy](https://authy.com), or an authenticator application", "<:point:995372986179780758> Scan the QR code or manually input the code", "<:point:995372986179780758> Once your 2FA application is setup, press continue!", `\n<:point:995372986179780758> **Code:** ${secret}`, `\n> ⚠️ Keep your account safe! Be on the lookout for scams, never scan a QR code with your discord app.`].join('\n'),
	TWOFACTORAUTHENTICATION_SETUP_COMPLETE_EMBED_TITLE: "2FA Setup Complete",
	TWOFACTORAUTHENTICATION_SETUP_COMPLETE_EMBED_DESCRIPTION: (backup: string) => ["<:point:995372986179780758> 2FA is now enabled globally on your account!", "<:point:995372986179780758> You will be prompted to enter this code upon a protected action", "\n> ⚠️ Please keep this backup code safe, it can be used to access your account and reconfigure 2FA. If you lose access to your authenticator, run /2fa again, and when prompted, enter a backup code, it will walk you through reconfiguring 2FA with your new authenticator.\n", `<:point:995372986179780758> ${backup}`].join('\n'),
	TWOFACTORAUTHENTICATION_DISABLED_EMBED_TITLE: "✅ Disabled 2FA",
	TWOFACTORAUTHENTICATION_NOT_CONFIGURED_EMBED_TITLE: "2FA Not Configured",
	TWOFACTORAUTHENTICATION_NOT_CONFIGURED_EMBED_DESCRIPTION: "<:point:995372986179780758> You do not have 2FA enabled on your account, set it up with /2fa configure",

	// STATISTICS COMMAND
	STATISTICS_COMMAND_NAME: "statistics",
	STATISTICS_COMMAND_DESCRIPTION: "Some interesting statistics about Sentry!",
	STATISTICS_EMBED_TITLE: "<:sentry:942693843269218334> Statistics",
	STATISTICS_EMBED_DESCRIPTION: (punishments: number, guilds: number, twofa: string) => [`<:point:995372986179780758> Since I was created, I have punished ${punishments} users`, `<:point:995372986179780758> In my ${guilds} *ish* guilds, I have met ${twofa} users who have enabled 2FA`].join('\n\n'),

	// ABOUT COMMAND
	ABOUT_COMMAND_NAME: "about",
	ABOUT_COMMAND_DESCRIPTION: "About Sentry",
	ABOUT_EMBED_TITLE: "<:sentry:942693843269218334> About Sentry",
	ABOUT_EMBED_DESCRIPTION: ['Sentry protects your guild from the next generation of discord scams. We have over 15 thousand data points which we use to prevent malicious users in your server, so that you can rest assured that your server will not fall prey to scams, and we are constantly improving, and tweaking our settings to ensure that the moment we find a new scam, its blocked by Sentry.\n', `<:point:995372986179780758> You are running Sentry v${process.env.SENTRY_VERSION ?? 'Unknown'}`].join('\n')
};

export default english;
