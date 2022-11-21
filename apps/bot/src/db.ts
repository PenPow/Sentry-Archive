import { default as IORedis } from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { config, logger } from './config.js';
import { fieldEncryptionMiddleware } from 'prisma-field-encryption';

export const Redis = new IORedis.default("redis://redis:6379")
export const Prisma = new PrismaClient({
	datasources: {
		db: {
			url: config.sentry.DATABASE_URL
		}
	}
})


if(config.sentry.ENCRYPTION_KEY.length == 0) {
	logger.fatal("Encryption Key Not Configured - Create One Using Interval") // TODO: Allow Disabling of Interval for Self-hosted Solutions and replace actions with scripts being ran manually.
} else {
	Prisma.$use(fieldEncryptionMiddleware({
		encryptionKey: config.sentry.ENCRYPTION_KEY
	}))
}

