import type { ButtonInteraction, ContextMenuCommandInteraction, RESTPostAPIApplicationCommandsJSONBody, SelectMenuInteraction } from 'discord.js';

export interface IFunction<T extends ButtonInteraction | ContextMenuCommandInteraction | SelectMenuInteraction> {
	id: string;
	execute: (interaction: T) => unknown;
	toJSON?: T extends ContextMenuCommandInteraction ? () => RESTPostAPIApplicationCommandsJSONBody : never;
}
