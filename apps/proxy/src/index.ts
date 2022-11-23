import "source-map-support/register.js";

import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { proxyRequests } from "@discordjs/proxy";
import { REST } from "@discordjs/rest";
import type { Config } from "shared";
import { parse } from "toml";
import { Logger } from "tslog";

const config: Config = parse(await readFile("config.toml", "utf8"));

const logger = new Logger();

// TODO: Implement Shared Cache
const api = new REST({ rejectOnRateLimit: () => true, retries: 0 }).setToken(
  config.discord.TOKEN
);
const server = createServer(proxyRequests(api));

const port = Number.parseInt(config.proxy.PORT, 10);
server.listen(port, () => logger.info(`Listening on port ${port}`));
