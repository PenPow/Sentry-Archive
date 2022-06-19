import { config as dotEnvConfig } from "https://deno.land/x/dotenv@v3.1.0/mod.ts";
import { GatewayIntents } from "https://deno.land/x/discordeno@13.0.0-rc31/mod.ts";
import { isDocker } from "https://deno.land/x/is_docker@v2.0.0/mod.ts";

const env = await isDocker() ? Deno.env.toObject() : dotEnvConfig({ export: true });

export const GATEWAY_INTENTS: (keyof typeof GatewayIntents)[] = [
  "GuildMembers",
  "GuildMessages",
  "Guilds",
];

if (!env.DISCORD) throw new Error("No Token Found");

export const DISCORD_TOKEN = env.DISCORD!;
export const MAX_SHARDS = env.MAX_SHARDS ? parseInt(env.MAX_SHARDS, 10) : 0;
export const FIRST_SHARD_ID = env.FIRST_SHARD_ID
  ? parseInt(env.FIRST_SHARD_ID, 10)
  : 0;
export const LAST_SHARD_ID = env.LAST_SHARD_ID
  ? parseInt(env.LAST_SHARD_ID, 10)
  : 0;
export const SHARDS_PER_CLUSTER = env.SHARDS_PER_CLUSTER
  ? parseInt(env.SHARDS_PER_CLUSTER, 10)
  : 10;
export const MAX_CLUSTERS = parseInt(env.MAX_CLUSTERS!, 10);
if (!MAX_CLUSTERS) {
  throw new Error(
    "How many clusters can you run on your machine (MAX_CLUSTERS)? Check your .env file!",
  );
}

export const EVENT_HANDLER_URL = env
  .EVENT_HANDLER_URL!;
if (!EVENT_HANDLER_URL) {
  throw new Error(
    "Hmm, it seems like you don't have somewhere to send events to (EVENT_HANDLER_URL). Please check your .env file!",
  );
}

export const REST_AUTHORIZATION_KEY = env.REST_AUTHORIZATION_KEY!;
if (!REST_AUTHORIZATION_KEY) {
  throw new Error(
    "You need to add a REST_AUTHORIZATION_KEY to your .env file!",
  );
}

export const EVENT_HANDLER_SECRET_KEY = env.EVENT_HANDLER_SECRET_KEY!;
if (!EVENT_HANDLER_SECRET_KEY) {
  throw new Error(
    "You need to add an EVENT_HANDLER_SECRET_KEY to your .env file!",
  );
}

export const BOT_ID = BigInt(atob(env.DISCORD.split(".")[0]));
if (!BOT_ID) {
  throw new Error(
    "Hmm, it seems like you didn't put in a valid DISCORD_TOKEN. Check your .env file!",
  );
}

export const REST_PORT = env.REST_PORT ? parseInt(env.REST_PORT, 10) : 5000;
export const REST_URL = env.REST_URL ?? "localhost";
export const EVENT_HANDLER_PORT = env.EVENT_HANDLER_PORT
  ? parseInt(env.EVENT_HANDLER_PORT, 10)
  : 7050;

export const DEVELOPMENT = env.DEVELOPMENT ?? false;

export const DEPLOY_ON_START = env.DEPLOY_ON_START === 'true' ?? false;

export const DEV_GUILD_ID = env.DEV_GUILD_ID ? BigInt(env.DEV_GUILD_ID) : 0n;
export const DEV_USER_ID = env.DEV_USER_ID ? BigInt(env.DEV_USER_ID) : 0n;

export const DB_INFO = {
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME ?? "db",
  host: env.DB_HOST ?? "localhost",
  port: parseInt(env.DB_PORT) ?? 5432,
  max: parseInt(env.DB_MAX) ?? 20,
};
