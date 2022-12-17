import type { Buffer } from 'node:buffer';
import { serialize, deserialize, type Document } from "bson";
import type Redis  from 'ioredis';
import { config, RedisInstance } from './db.js';

// Cache code adapted from https://github.com/ChatSift/AutoModerator
type IDataTransformer<T extends Document> = {
	toBuffer(data: T): Buffer,
	toJSON(data: Buffer): T
}

class Cache<T extends Document> {
	protected readonly redis: Redis.Redis;

	protected readonly transformer: IDataTransformer<T>;

	protected readonly TTL: number;

	public constructor() {
		this.TTL = 60_000;

		this.transformer = {
			toBuffer(data) {
				return serialize(data);
			},
			toJSON(buffer) {
				return deserialize(buffer) as T;
			}
		};
		
		this.redis = RedisInstance;
	}

	protected makeKey(id: string): string {
		return `rest.cache.${id}`;
	}

	public async has(id: string): Promise<boolean> {
		return Boolean(await this.redis.exists(this.makeKey(id)));
	}

	public async get(id: string): Promise<T | null> {
		const key = this.makeKey(id);
		const data = await this.redis.getBuffer(key);

		if(!data) return null;

		await this.redis.pexpire(key, this.TTL);
		return this.transformer.toJSON(data);
	}

	public async set(id: string, value: T): Promise<void> {
		const key = this.makeKey(id);
		
		const data = this.transformer.toBuffer(value);
		await this.redis.set(key, data, 'PX', this.TTL);
	}
}

const cache = new Cache<any>();

export function normalizeRoute(route: string): [string, string[]] {
	const normalized = route.replaceAll(/\d{17,19}/g, ':id').replace(`/api/v${config.proxy.API_VERSION}`, '');
	const components = route.replace(`/api/v${config.proxy.API_VERSION}`, '').split('/').slice(1);

	return [normalized, components];
}

export async function fetchCache<T>(route: string): Promise<T | null> {
	const [normalized, components] = normalizeRoute(route);

	switch (normalized) {
		case '/guilds/:id': {
			const [, id] = components as [string, string];

			return cache.get(id) as Promise<T | null>;
		}

		// eslint-disable-next-line sonarjs/no-duplicated-branches
		case '/users/:id': {
			const [, id] = components as [string, string];

			return cache.get(id) as Promise<T | null>;
		}

		case '/guilds/:id/members/:id': {
			const [, guild, , member] = components as [string, string, string, string];

			return cache.get(`${guild}.members.${member}`) as Promise<T | null>;
		}

		case '/guilds/:id/members/roles': {
			const [, id] = components as [string, string, string, string];

			return cache.get(`${id}.roles`) as Promise<T | null>;
		}

		default: {
			return null;
		}
	}
}

export async function setCache(route: string, data: any): Promise<void> {
	const [normalized, components] = normalizeRoute(route);
	if (normalized === '/guilds/:id' || normalized === '/users/:id') {
		const [, id] = components as [string, string];
		await cache.set(id, data);
	}
	
	else if (normalized === '/guilds/:id/members/:id') {
		const [, guild, , member] = components as [string, string, string, string];
		await cache.set(`${guild}.members.${member}`, data);
	}

	else if (normalized === '/guilds/:id/members/roles') {
		const [, id] = components as [string, string, string, string];
		await cache.set(`${id}.roles`, data);
	}
}