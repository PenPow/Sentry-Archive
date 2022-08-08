import type { AutocompleteInteraction, ButtonInteraction, ChatInputCommandInteraction, ContextMenuCommandInteraction, RESTPostAPIContextMenuApplicationCommandsJSONBody, RESTPostAPIChatInputApplicationCommandsJSONBody, SelectMenuInteraction, ApplicationCommandType, ApplicationCommandOptionType, ChannelType, ApplicationCommandOptionChoiceData } from 'discord.js';
import type { translationKeys } from '../../common/translations/translate.js';

export enum PermissionTier {
	User,
	Admin,
	Owner,
	Developer,
}

export enum FunctionType {
	ChatInput,
	ContextMenu,
	SelectMenu,
	Button,
}

export type IFunction = ICommandFunction | IContextMenuFunction | ISelectMenuFunction | IButtonFunction;
export type IComponentFunction = ISelectMenuFunction | IButtonFunction;

export interface ICommandFunction {
	type: FunctionType.ChatInput;
	permissions: PermissionTier;
	execute: (interaction: ChatInputCommandInteraction) => unknown;
	handleAutocomplete?: (interaction: AutocompleteInteraction) => ApplicationCommandOptionChoiceData[] | Promise<ApplicationCommandOptionChoiceData[]>;
	toJSON: () => RESTApplicationCommandJSON;
}

export interface IContextMenuFunction {
	type: FunctionType.ContextMenu;
	permissions: PermissionTier;
	execute: (interaction: ContextMenuCommandInteraction) => unknown;
	toJSON: () => RESTContextMenuJSON;
}

export interface ISelectMenuFunction {
	type: FunctionType.SelectMenu;
	id: string;
	permissions: PermissionTier;
	execute: (interaction: SelectMenuInteraction) => unknown;
}

export interface IButtonFunction {
	type: FunctionType.Button;
	id: string;
	permissions: PermissionTier;
	execute: (interaction: ButtonInteraction) => unknown;
}

export type RESTCommandJSON = RESTApplicationCommandJSON | RESTContextMenuJSON;

export interface RESTApplicationCommandJSON extends RESTPostAPIChatInputApplicationCommandsJSONBody {
	name: translationKeys;
	description: translationKeys;
	type: ApplicationCommandType.ChatInput;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	options?: RESTApplicationCommandOptionJSON<any>[];
}

export interface RESTContextMenuJSON extends RESTPostAPIContextMenuApplicationCommandsJSONBody {
	name: translationKeys;
	type: ApplicationCommandType.User | ApplicationCommandType.Message;
}

export interface RESTApplicationCommandOptionJSON<T extends ApplicationCommandOptionType> {
	type: T;
	name: translationKeys;
	description: translationKeys;
	required?: boolean;
	choices?: T extends ApplicationCommandOptionType.String | ApplicationCommandOptionType.Integer | ApplicationCommandOptionType.Number ? RESTApplicationCommandsOptionChoicesJSON<T>[] : never;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	options?: T extends ApplicationCommandOptionType.Subcommand | ApplicationCommandOptionType.SubcommandGroup ? RESTApplicationCommandOptionJSON<any>[] : never;
	channel_types?: T extends ApplicationCommandOptionType.Channel ? ChannelType[] : never;
	min_value?: T extends ApplicationCommandOptionType.Integer | ApplicationCommandOptionType.Number ? number : never;
	max_value?: T extends ApplicationCommandOptionType.Integer | ApplicationCommandOptionType.Number ? number : never;
	min_length?: T extends ApplicationCommandOptionType.String ? number : never;
	max_length?: T extends ApplicationCommandOptionType.String ? number : never;
	autocomplete?: T extends ApplicationCommandOptionType.String | ApplicationCommandOptionType.Integer | ApplicationCommandOptionType.Number ? boolean : never;
}

export interface RESTApplicationCommandsOptionChoicesJSON<T extends ApplicationCommandOptionType.String | ApplicationCommandOptionType.Integer | ApplicationCommandOptionType.Number> {
	name: translationKeys;
	value: T extends ApplicationCommandOptionType.String ? string : number;
}
