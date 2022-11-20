import { parse } from 'toml';
import { readFile } from 'node:fs/promises';
import { Logger } from "tslog";
import { default as IORedis } from 'ioredis';

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
	proxy: {
		PORT: string
	}
	clamav: {
		MIRROR: string
	}
};

export const config: Config = parse(await readFile('config.toml', 'utf-8'))

export const logger = new Logger();

export const Redis = new IORedis.default("redis://redis:6379")