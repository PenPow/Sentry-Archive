import { config } from 'dotenv';
config();

export const DEVELOPMENT = Boolean(process.env.DEVELOPMENT);
export const DISCORD_TOKEN = process.env.DISCORD;
export const DB_URL = process.env.DATABASE_URL;
export const VIRUS_TOTAL = process.env.VIRUS_TOTAL;