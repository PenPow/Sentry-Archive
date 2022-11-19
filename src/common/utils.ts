import { parse } from 'toml';
import { readFile } from 'node:fs/promises';
import { Logger } from "tslog";

interface Config {
	// [ key: string ]: string | number | Config,
	discord: {
		PUBLIC_KEY: string,
		TOKEN: `${string}.${string}.${string}`
	},
	fastify: {
		PORT: number
	},
	interval: {
		DEV_API_KEY: string,
		PRODUCTION_API_KEY: string
	},
	sentry: {}
};

export const config: Config = parse(await readFile('config.toml', 'utf-8'))

export const logger: Logger = new Logger();