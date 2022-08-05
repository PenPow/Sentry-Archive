import { config } from 'dotenv';
config();

export const DEVELOPMENT = process.env.DEVELOPMENT === "true" ? true : false;
export const DISCORD_TOKEN = process.env.DISCORD;
export const DB_URL = process.env.DATABASE_URL;

export const DEV_GUILD_ID = process.env.DEV_GUILD_ID;
export const DEPLOY_ON_START = process.env.DEPLOY_ON_START === "true";

