import { PrismaClient, PunishmentType } from '@prisma/client';
import Redis from "ioredis";
import { DB_URL } from './config.js';

export const prisma = new PrismaClient({ datasources: { db: { url: DB_URL } } });
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const PunishmentEnum = PunishmentType as Record<string, PunishmentType>;

export const redis = new Redis.default("redis://redis:6379");
