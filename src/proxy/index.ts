import "source-map-support/register.js";

import { createServer } from 'node:http';
import { proxyRequests } from '@discordjs/proxy';
import { REST } from '@discordjs/rest';
import { config, logger } from '../common/utils.js';

const api = new REST({ rejectOnRateLimit: () => true, retries: 0 }).setToken(config.discord.TOKEN);
const server = createServer(proxyRequests(api));

const port = Number.parseInt(config.proxy.PORT ?? '8080', 10);
server.listen(port, () => logger.info(`Listening on port ${port}`));