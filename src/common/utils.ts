import { parse } from 'toml';
import { readFile } from 'node:fs/promises';
import { Logger } from "tslog";

interface Config {
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
	proxy: {
		PORT: string
	}
	clamav: {
		MIRROR: string
	},
	sentry: {
		DATABASE_URL: `postgresql://${string}:${string}@${string}:${number}/${string}`,
		ENCRYPTION_KEY: string
	}
};

export const config: Config = parse(await readFile('config.toml', 'utf-8'))

export const logger = new Logger();