import "source-map-support/register.js";

import { fastify as FastifyServer, type FastifyRequest } from "fastify";
import { config, logger, Redis } from "./config.js";
import { reloadSources } from "./utils/reloadSources.js";

const fastify = FastifyServer({
	logger: false,
});

fastify.get('/loaded', async (_req, res) => {
	const count = await Redis.scard("scam_domains");

	return res.status(200).send({ ok: true, data: { count }});
});

fastify.get('/reload', async (req, res) => {
	if(!req.headers.token) return res.status(401).send({ ok: false, error: { message: 'Missing Token' } });
	if(req.headers.token !== config.discord.TOKEN) return res.status(403).send({ ok: false, error: { message: 'Invalid Token' } });

	await reloadSources();

	return res.status(200).send({ ok: true, data: null });
});

fastify.post('/scan', async (req: FastifyRequest<{ Body: string }>, res) => {
	const domain = JSON.parse(req.body).domain;
	if(!domain) return res.status(401).send({ ok: false, error: { message: 'No Domain Specified' }});

	const hasDomain = Boolean(await Redis.sismember("scam_domains", domain));
	return res.status(200).send({ ok: true, data: { isMalicious: hasDomain }});
});

// eslint-disable-next-line promise/prefer-await-to-callbacks
fastify.listen({ port: config.phishertools.PORT, host: "::" }, (err, address) => {
	if (err) return logger.fatal(err);
  
	return logger.info(`Listening on ${address}`);
});  