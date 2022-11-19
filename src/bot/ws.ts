import { PubSubRedisBroker } from '@discordjs/brokers';
import { default as Redis } from 'ioredis';
import { logger } from '../common/utils.js'
import type { APIMessage } from 'discord-api-types/v10';

export async function init() {
	logger.debug('Preparing Brokers')

	const redis = new Redis.default("redis://redis:6379")
	await redis.config('SET', "replica-read-only", "no")

	const broker = new PubSubRedisBroker({ redisClient: redis });

	logger.info('Connected Brokers to Redis')

	broker.on('message', ({ data, ack }) => {
		logger.debug('Recieved Message')
		
		const message: APIMessage = data
		logger.info(message.id)

		void ack();
	})

	await broker.subscribe('subscribers', ['message'])
}