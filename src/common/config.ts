import { config } from 'dotenv';
config();

export const DEVELOPMENT = Boolean(process.env.DEVELOPMENT);
export const DISCORD_TOKEN = process.env.DISCORD;
