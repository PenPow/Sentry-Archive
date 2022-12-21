import { Buffer } from "node:buffer";
import { PrismaClient } from "@prisma/client";
import { default as IORedis } from "ioredis";
import { fieldEncryptionMiddleware } from "prisma-field-encryption";
import { config, logger } from "./config.js";
import { UnbanPunishment } from "./structures/Punishment.js";

export const Prisma = new PrismaClient({
  datasources: {
    db: {
      url: config.sentry.DATABASE_URL,
    },
  },
});

if (config.sentry.ENCRYPTION_KEY.length === 0) {
  logger.fatal("Encryption Key Not Configured - Create One Using Interval"); // TODO: Allow Disabling of Interval for Self-hosted Solutions and replace actions with scripts being ran manually.
} else {
  Prisma.$use(
    fieldEncryptionMiddleware({
      encryptionKey: config.sentry.ENCRYPTION_KEY,
    })
  );
}

export const Redis = new IORedis.default("redis://redis:6379");
export const SubscriberRedis = new IORedis.default("redis://redis:6379");

await SubscriberRedis.config("SET", "notify-keyspace-events", "Kx");
await SubscriberRedis.psubscribe("*");

SubscriberRedis.on(
  "pmessage",
  async (_pattern: string, message: string, channel: string) => {
    if (channel === "expired") {
      const key = message.split("__")[2]?.slice(1).split("_")[1]; // punishment_5
      if (!key || Number.isNaN(Number.parseInt(key, 10))) return;

      const punishment = await UnbanPunishment.fetch({
        id: Number.parseInt(key, 10),
      });

      if (!punishment?.expires) return;

      await new UnbanPunishment({ guildId: punishment.guildId, references: punishment.caseId, userId: punishment.userId, reason: "Timed Ban Expiration", moderatorId: Buffer.from(config.discord.TOKEN.split(".")[0]!, "base64").toString() }).build();
    }
  }
);
