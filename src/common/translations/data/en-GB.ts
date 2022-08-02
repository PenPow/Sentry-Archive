const english = {

	// AUTO MODERATION
	ANTI_RAID_NUKE_PUNISHMENT_REASON: "Anti Raid Punishment",
	SOFTBAN_UNBAN_REASON: "User was softbanned",
	HEAT_SYSTEM_PUNISHMENT_REASON: (reason: string, heat: number) => `${reason} (${Math.round(heat)} Heat)`,

	// EVAL COMMAND
	EVAL_COMMAND_NAME: "eval",
	EVAL_COMMAND_DESCRIPTION: "oops, i forgot to remove this",
	EVAL_COMMAND_SOURCE_OPTION_NAME: "sourcebin",
	EVAL_COMMAND_SOURCE_OPTION_DESCRIPTION: "link to sourcebin",

	// BAN COMMAND
	BAN_COMMAND_NAME: "ban",
	BAN_COMMAND_DESCRIPTION: "Remove troublemakers from your server",

	// UNBAN COMMAND
	UNBAN_COMMAND_NAME: "unban",
	UNBAN_COMMAND_DESCRIPTION: "Let them back in",
	UNBAN_MEMBER_OPTION_DESCRIPTION: "Enter their user ID here",

	// KICK COMMAND
	KICK_COMMAND_NAME: "kick",
	KICK_COMMAND_DESCRIPTION: "Remove a user from your server",

	// SOFTBAN COMMAND
	SOFTBAN_COMMAND_NAME: "softban",
	SOFTBAN_COMMAND_DESCRIPTION: "Kick a user and remove their messages! Best of both worlds.",

	// TIMEOUT COMMAND
	TIMEOUT_COMMAND_NAME: "timeout",
	TIMEOUT_COMMAND_DESCRIPTION: "Ssssh a user",
	TIMEOUT_DURATION_OPTION_NAME: "duration",
	TIMEOUT_DURATION_OPTION_DESCRIPTION: "Number of hours to timeout for",

	// WARN COMMAND
	WARN_COMMAND_NAME: "warn",
	WARN_COMMAND_DESCRIPTION: "Thats an infraction! Slap them on the wrist",

	// GENERAL MODERATION COMMANDS
	MODERATION_DEFAULT_REASON: 'No Reason Specified',
	MODERATION_TARGET_OPTION_NAME: "user",
	MODERATION_TARGET_OPTION_DESCRIPTION: "User to punish",
	MODERATION_REASON_OPTION_NAME: "reason",
	MODERATION_REASON_OPTION_DESCRIPTION: "Note to add to punishment",

	// SLOWMODE COMMAND
	SLOWMODE_COMMAND_NAME: "slowmode",
	SLOWMODE_COMMAND_DESCRIPTION: "Slow this party down",
	SLOWMODE_DURATION_OPTION_DESCRIPTION: "Number of seconds to set slowmode to",
};

export default english;
