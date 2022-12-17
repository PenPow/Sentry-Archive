import "source-map-support/register.js";

/* eslint-disable require-atomic-updates */
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { URL } from "node:url";
import {
  DiscordAPIError,
  HTTPError,
  RateLimitError,
  RequestMethod,
  parseResponse,
  REST,
  type RouteLike,
} from "@discordjs/rest";
import { Logger } from "tslog";
import { fetchCache, setCache } from "./cache.js";
import { config } from "./db.js";

const logger = new Logger();

function proxyRequests(
  rest: REST
): (req: IncomingMessage, res: ServerResponse) => Promise<void> | void {
	// @ts-expect-error all code paths do return
  return async (req, res) => {
    const { method, url, headers } = req;

    if (!method || !url) throw new TypeError("Missing Method or URL");

    const parsedUrl = new URL(url, "http://noop");
    const route = parsedUrl.pathname.replace(
	  // eslint-disable-next-line prefer-named-capture-group, unicorn/no-unsafe-regex
      /^\/api(\/v\d+)?/,
      ""
    ) as RouteLike;

	if(method === RequestMethod.Get) {
		const cache = await fetchCache(route);
		if(cache) {
			logger.trace(`Cache Hit on ${route}`);
			res.statusCode = 200;
			res.setHeader('Content-Type', 'application/json');
			
			return void res.end(JSON.stringify(cache));
		}
	}

	logger.debug(`Request to ${url}`);

    try {
      const resp = await rest.raw({
        body: req,
        fullRoute: route,
        method: method as RequestMethod,
        passThroughBody: true,
        query: parsedUrl.searchParams,
        headers: {
          "Content-Type": headers["content-type"]!,
        },
      });

      res.statusCode = resp.statusCode;

      // Remove Ratelimit Headers - We handle them, and we dont want upstream to handle it
      for (const header of Object.keys(resp.headers)) {
        if (header.includes("ratelimit")) continue;
        res.setHeader(header, resp.headers[header]!);
      }

      const data = await parseResponse(resp);
	  res.write(JSON.stringify(data));

	  await setCache(route, data);
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

const rest = new REST({
  rejectOnRateLimit: () => true,
  retries: 0,
  version: config.proxy.API_VERSION.toString(),
}).setToken(config.discord.TOKEN);

const server = createServer(proxyRequests(rest));

server.listen(config.proxy.PORT, () =>
  logger.info(`Listening on http://localhost:${config.proxy.PORT}`)
);
