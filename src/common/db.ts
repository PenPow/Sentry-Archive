import { PrismaClient } from '@prisma/client';
import Redis from "ioredis";
import { DB_URL } from './config.js';

export const prisma = new PrismaClient({ datasources: { db: { url: DB_URL } } });
export const redis = new Redis.default("redis://redis:6379");
