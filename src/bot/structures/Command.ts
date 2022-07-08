import type { ChatInputCommandInteraction, RESTPostAPIApplicationCommandsJSONBody, PermissionFlagsBits } from "discord.js";

export type CommandPermissions = [Array<typeof PermissionFlagsBits[keyof typeof PermissionFlagsBits]> | null, Array<typeof PermissionFlagsBits> | null];

export enum PermissionLevel {
	ALL = 1,
	MOD,
	ADMIN,
	TRUSTED,
	OWNER
}

export interface ICommand {
	name: string;
	description: string;
	permissions: CommandPermissions;
	permissionLevel: PermissionLevel;
	execute: (interaction: ChatInputCommandInteraction) => unknown;
	toJSON: () => RESTPostAPIApplicationCommandsJSONBody;
}
