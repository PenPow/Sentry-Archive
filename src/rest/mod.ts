import {
  DISCORD_TOKEN,
  REST_AUTHORIZATION_KEY,
  REST_PORT,
REST_URL,
} from "@config";
import {
  BASE_URL,
  createRestManager,
} from "https://deno.land/x/discordeno@13.0.0-rc45/mod.ts";
import { log, LogLevel } from "../common/logger.ts";

const rest = createRestManager({
  token: DISCORD_TOKEN,
  secretKey: REST_AUTHORIZATION_KEY,
  customUrl: `http://${REST_URL}:${REST_PORT}`,
  debug: (text: string) =>
    log({ level: LogLevel.Debug, prefix: "Manager" }, text),
});

const server = Deno.listen({ port: REST_PORT });

log(
  { level: LogLevel.Info, prefix: "REST" },
  `HTTP webserver running. Access it at: http://${REST_URL}:${REST_PORT}/`,
);

for await (const conn of server) {
  handleReq(conn);
}

async function handleReq(conn: Deno.Conn) {
  const httpConn = Deno.serveHttp(conn);

  for await (const requestEvent of httpConn) {
    if(requestEvent.request.url.split("/")[requestEvent.request.url.split("/").length - 1] === "health-check") return requestEvent.respondWith(new Response(JSON.stringify({ status: 'Alive'}), { status: 200 }))
    if (
      !REST_AUTHORIZATION_KEY ||
      REST_AUTHORIZATION_KEY !==
        requestEvent.request.headers.get("AUTHORIZATION")
    ) {
      return requestEvent.respondWith(
        new Response(JSON.stringify({ error: "Invalid authorization key." }), {
          status: 401,
        }),
      );
    }

    const json = requestEvent.request.body
      ? (await requestEvent.request.json())
      : undefined;

    try {
      const result = await rest.runMethod(
        rest,
        requestEvent.request.method as RequestMethod,
        `${BASE_URL}${
          requestEvent.request.url.substring(
            `http://${REST_URL}:${REST_PORT}`.length,
          )
        }`,
        json,
      );

      if (result) {
        requestEvent.respondWith(
          new Response(JSON.stringify(result), { status: 200 }),
        );
      } else {
        requestEvent.respondWith(new Response(undefined, { status: 204 }));
      }
    } catch (err) {
      log({ level: LogLevel.Error, prefix: "REST" }, err);

      requestEvent.respondWith(
        new Response(JSON.stringify(err), { status: err.code }),
      );
    }
  }
}

type RequestMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
