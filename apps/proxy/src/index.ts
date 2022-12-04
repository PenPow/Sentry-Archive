import "source-map-support/register.js";

/* eslint-disable require-atomic-updates */
import { readFile } from "node:fs/promises";
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { pipeline } from "node:stream/promises";
import { URL } from "node:url";
import {
  DiscordAPIError,
  HTTPError,
  RateLimitError,
  REST,
  type RequestMethod,
  type RouteLike,
} from "@discordjs/rest";
import type { Config } from "shared";
import { parse } from "toml";
import { Logger } from "tslog";

const logger = new Logger();

function proxyRequests(
  rest: REST
): (req: IncomingMessage, res: ServerResponse) => Promise<void> | void {
  return async (req, res) => {
    const { method, url, headers } = req;
    logger.debug(`Request to ${url}`);

    if (!method || !url) throw new TypeError("Missing Method or URL");

    const parsedUrl = new URL(url, "http://noop");
    const route = parsedUrl.pathname.replace(
	  // eslint-disable-next-line prefer-named-capture-group, unicorn/no-unsafe-regex
      /^\/api(\/v\d+)?/,
      ""
    ) as RouteLike;

    try {
      const data = await rest.raw({
        body: req,
        fullRoute: route,
        method: method as RequestMethod,
        passThroughBody: true,
        query: parsedUrl.searchParams,
        headers: {
          "Content-Type": headers["content-type"]!,
        },
      });

      res.statusCode = data.statusCode;

      // Remove Ratelimit Headers - We handle them, and we dont want upstream to handle it
      for (const header of Object.keys(data.headers)) {
        if (header.includes("ratelimit")) continue;
        res.setHeader(header, data.headers[header]!);
      }

      await pipeline(data.body, res);
    } catch (error) {
      if (error instanceof DiscordAPIError || error instanceof HTTPError) {
        res.statusCode = error.status;

        if ("rawError" in error) {
          res.setHeader("Content-Type", "application/json");
          res.write(JSON.stringify(error.rawError));
        }
      } else if (error instanceof RateLimitError) {
        res.statusCode = 429;
        res.setHeader("Retry-After", error.timeToReset / 1_000);
      } else if (error instanceof Error && error.name === "AbortError") {
        res.statusCode = 504;
        res.statusMessage = "Upstream timed out";
      } else {
        res.statusCode = 500;
      }
    } finally {
      res.end();
    }
  };
}

const config: Config = parse(await readFile("config.toml", "utf8"));

if (
  !config.discord.TOKEN ||
  ![6, 7, 8, 9, 10].includes(config.proxy.API_VERSION)
) {
  throw new Error("Invalid Config");
}

const rest = new REST({
  rejectOnRateLimit: () => true,
  retries: 0,
  version: config.proxy.API_VERSION.toString(),
}).setToken(config.discord.TOKEN);
const server = createServer(proxyRequests(rest));

server.listen(config.proxy.PORT, () =>
  logger.info(`Listening on http://localhost:${config.proxy.PORT}`)
);
