const english = {
	ANTI_RAID_NUKE_PUNISHMENT_REASON: "Anti Raid Punishment",
	SOFTBAN_UNBAN_REASON: "User was softbanned",
	HEAT_SYSTEM_PUNISHMENT_REASON: (reason: string, heat: number) => `${reason} (${Math.round(heat)} Heat)`
};

export default english;
