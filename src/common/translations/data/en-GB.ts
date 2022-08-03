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

	// GENERAL MODERATION COMMANDS
	MODERATION_DEFAULT_REASON: 'No Reason Specified',
	MODERATION_TARGET_OPTION_NAME: "user",
	MODERATION_TARGET_OPTION_DESCRIPTION: "User to punish",
	MODERATION_REASON_OPTION_NAME: "reason",
	MODERATION_REASON_OPTION_DESCRIPTION: "Note to add to punishment",
	MODERATION_REFERENCE_OPTION_NAME: "reference",
	MODERATION_REFERENCE_OPTION_DESCRIPTION: "Reference another case in this punishment!",

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

	// SLOWMODE COMMAND
	SLOWMODE_COMMAND_NAME: "slowmode",
	SLOWMODE_COMMAND_DESCRIPTION: "Slow this party down",
	SLOWMODE_DURATION_OPTION_DESCRIPTION: "Number of seconds to set slowmode to",

	// REASON COMMAND
	REASON_COMMAND_NAME: "reason",
	REASON_COMMAND_DESCRIPTION: "Modify the reason of a case",
	REASON_CASE_OPTION_NAME: "case",
	REASON_CASE_OPTION_DESCRIPTION: "What case are we talking about?",
	REASON_NEWREASON_OPTION_NAME: "reason",
	REASON_NEWREASON_OPTION_DESCRIPTION: "Whats the new reason",

	// CASE COMMAND
	CASE_COMMAND_NAME: "case",
	CASE_COMMAND_DESCRIPTION: "Lookup a case",

	// HISTORY COMMAND
	HISTORY_COMMAND_NAME: "history",
	HISTORY_COMMAND_DESCRIPTION: "Lookup a users history",
	HISTORY_COMMAND_USER_OPTION_DESCRIPTION: "User to lookup",

	// HISTORY CONTEXT
	HISTORY_CONTEXT_NAME: "Moderation History",
};

export default english;
