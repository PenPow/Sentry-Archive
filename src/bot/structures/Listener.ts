import type { Client, Events } from 'discord.js';

export interface IListener {
	event: typeof Events[keyof typeof Events];
	execute: (client: Client) => unknown;
}
