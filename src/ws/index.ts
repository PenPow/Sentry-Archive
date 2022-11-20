import "source-map-support/register.js";

import { GatewayIntentBits } from 'discord-api-types/v10'
import { Client, Options } from 'discord.js'
import { config, logger } from '../common/utils.js'
import { PubSubRedisBroker } from '@discordjs/brokers';
import { Redis } from './db.js'

logger.debug('Connecting WS Proxy to Gateway')

const client = new Client({
	intents: [GatewayIntentBits.AutoModerationExecution, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.Guilds],
	makeCache: Options.cacheWithLimits({
		"ApplicationCommandManager": 0,
		"BaseGuildEmojiManager": 0,
		"GuildBanManager": 0,
		"GuildEmojiManager": 0,
		"GuildForumThreadManager": 0,
		"GuildInviteManager": 0,
		"GuildMemberManager": 0,
		"GuildScheduledEventManager": 0,
		"GuildStickerManager": 0,
		"GuildTextThreadManager": 0,
		"MessageManager": 0,
		"PresenceManager": 0,
		"ReactionManager": 0,
		"ReactionUserManager": 0,
		"StageInstanceManager": 0,
		"ThreadManager": 0,
		"ThreadMemberManager": 0,
		"UserManager": 0,
		"VoiceStateManager": 0
	}),
	rest: {
		api: "http://rest:3000/api"
	}
})

await client.login(config.discord.TOKEN)
await new Promise((resolve) => client.once('ready', () => resolve(true)))

logger.info('Connected to Gateway')

logger.debug('Preparing Brokers')

await Redis.config('SET', "replica-read-only", "no")

const broker = new PubSubRedisBroker({ redisClient: Redis });

logger.info('Connected Brokers to Redis')

client.on('messageCreate', async (message) => {
	if(message.author.bot) return;

	logger.info(`Recieved Message ${message.id}`)
	logger.debug(`Sending Message ${message.id} to Broker`)
	await broker.publish('messages', message.toJSON())
	logger.debug(`Sent ${message.id} successfully`)
})