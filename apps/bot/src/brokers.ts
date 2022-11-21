import { PubSubRedisBroker, RPCRedisBroker  } from '@discordjs/brokers';
import { Redis } from './db.js'
import type { APIMessage } from 'discord-api-types/v10';
import { logger } from './config.js';

logger.debug('Preparing Brokers')

await Redis.config('SET', "replica-read-only", "no")

const WebSocketBroker = new PubSubRedisBroker({ redisClient: Redis });
export const AntiVirusBroker = new RPCRedisBroker({ redisClient: Redis })

logger.info('Connected Brokers to Redis')

WebSocketBroker.on('messages', ({ data, ack }) => {	
	void ack();
	
	const message: APIMessage = data
	logger.debug(`Recieved Message ${message.id}`)
})

await WebSocketBroker.subscribe('subscribers', ['messages'])