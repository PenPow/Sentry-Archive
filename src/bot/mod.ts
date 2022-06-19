import {
  BOT_ID,
  DEPLOY_ON_START,
  DEVELOPMENT,
  DISCORD_TOKEN,
  EVENT_HANDLER_PORT,
  EVENT_HANDLER_SECRET_KEY,
  GATEWAY_INTENTS,
  REST_AUTHORIZATION_KEY,
  REST_PORT,
REST_URL,
} from "@config";
import {
  createBot,
  createRestManager,
  DiscordGatewayPayload,
} from "../../deps.ts";
import { log, LogLevel } from "../common/logger.ts";
import { registerLocaleCommands } from "./deploy.ts";
import { setupEventHandlers } from "./events/mod.ts";

export const bot = createBot({
  token: DISCORD_TOKEN,
  botId: BOT_ID,
  events: {},
  intents: GATEWAY_INTENTS,
});

setupEventHandlers();

bot.rest = createRestManager({
  token: DISCORD_TOKEN,
  secretKey: REST_AUTHORIZATION_KEY,
  customUrl: `http://${REST_URL}:${REST_PORT}`,
});

if (DEVELOPMENT && DEPLOY_ON_START) {
  await registerLocaleCommands(bot);
}

const server = Deno.listen({ port: EVENT_HANDLER_PORT });
log(
  { level: LogLevel.Info, prefix: "Bot" },
  `HTTP webserver running. Access it at: http://localhost:${EVENT_HANDLER_PORT}/`,
);

for await (const conn of server) {
  handleRequest(conn);
}

async function handleRequest(conn: Deno.Conn) {
  const httpConn = Deno.serveHttp(conn);

  for await (const requestEvent of httpConn) {
    if(requestEvent.request.url.split("/")[requestEvent.request.url.split("/").length - 1] === "health-check") return requestEvent.respondWith(new Response(JSON.stringify({ status: 'Alive'}), { status: 200 }))
    if (
      !EVENT_HANDLER_SECRET_KEY ||
      EVENT_HANDLER_SECRET_KEY !==
        requestEvent.request.headers.get("AUTHORIZATION")
    ) {
      return requestEvent.respondWith(
        new Response(JSON.stringify({ error: "Invalid secret key." }), {
          status: 401,
        }),
      );
    }

    if (requestEvent.request.method !== "POST") {
      return requestEvent.respondWith(
        new Response(JSON.stringify({ error: "Method not allowed." }), {
          status: 405,
        }),
      );
    }

    const json = (await requestEvent.request.json()) as {
      data: DiscordGatewayPayload;
      shardId: number;
    };
    bot.events.raw(bot, json.data, json.shardId);

    if (json.data.t && json.data.t !== "RESUMED") {
      if (!["READY", "GUILD_LOADED_DO"].includes(json.data.t)) {
        await bot.events.dispatchRequirements(bot, json.data, json.shardId);
      }

      bot.handlers[json.data.t]?.(bot, json.data, json.shardId);
    }

    requestEvent.respondWith(
      new Response(undefined, {
        status: 204,
      }),
    );
  }
}
