import "source-map-support/register.js";
import { init as intervalInit } from "./interval.js";
import { init as proxyInit } from "./ws.js"

import { type FastifyReply, type FastifyRequest, fastify as FastifyServer } from 'fastify'; // ts being weird forcing me to imp
import { verify, PlatformAlgorithm } from "discord-verify/node";
import { type APIInteraction, InteractionResponseType, InteractionType } from "discord-api-types/v10";
import { webcrypto } from "node:crypto";
import { config, logger } from '../common/utils.js';
import { REST as RestClient } from "@discordjs/rest";

intervalInit()
proxyInit()

const fastify = FastifyServer({
  logger: false
})

fastify.post("/", async (req: FastifyRequest<{
	Body: APIInteraction;
	Headers: {
		"x-signature-ed25519": string;
		"x-signature-timestamp": string;
	};
}>, res: FastifyReply) => {
	logger.debug('Recived Interaction: ', req.body.token)

	const signature = req.headers["x-signature-ed25519"]
	const timestamp = req.headers["x-signature-timestamp"]
	const body = JSON.stringify(req.body)

	if(!(await verify(body, signature, timestamp, config.discord.PUBLIC_KEY, webcrypto.subtle, PlatformAlgorithm.NewNode ))) {
		logger.error("Failed to validate signature: ", req.body.token)
		return res.code(401).send("Invalid Signature")
	}

	const interaction = req.body;

	if(interaction.type == InteractionType.Ping) {
		logger.debug("Sending Pong")
		return res.send({ type: InteractionResponseType.Pong })
	}

	return await res.send({
		type: InteractionResponseType.ChannelMessageWithSource,
		data: { content: "Hello World!", flags: 1 << 6 }
	});
});

fastify.listen({ port: config.fastify.PORT }, (err, address) => {
	if(err) return logger.fatal(err);

	return logger.info(`Listening on ${address}`)
});

export const REST = new RestClient({ version: "10" }).setToken(config.discord.TOKEN)