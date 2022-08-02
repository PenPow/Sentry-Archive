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

	// KICK COMMAND
	KICK_COMMAND_NAME: "kick",
	KICK_COMMAND_DESCRIPTION: "Remove a user from your server",

	// SOFTBAN COMMAND
	SOFTBAN_COMMAND_NAME: "softban",
	SOFTBAN_COMMAND_DESCRIPTION: "Kick a user and remove their messages! Best of both worlds.",
	// GENERAL MODERATION COMMANDS
	MODERATION_DEFAULT_REASON: 'No Reason Specified',
	MODERATION_TARGET_OPTION_NAME: "user",
	MODERATION_TARGET_OPTION_DESCRIPTION: "User to punish",
	MODERATION_REASON_OPTION_NAME: "reason",
	MODERATION_REASON_OPTION_DESCRIPTION: "Note to add to punishment"
};

export default english;
