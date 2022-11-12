import "source-map-support/register.js";
import "./interval.js";

import Fastify, { FastifyReply, FastifyRequest } from 'fastify';
import { verify, PlatformAlgorithm } from "discord-verify/node";
import { APIInteraction, InteractionResponseType, InteractionType } from "discord-api-types/v10";
import { webcrypto } from "node:crypto";
import { config, log } from './utils.js';
import { REST as RestClient } from "@discordjs/rest";

const fastify = Fastify({
  logger: false
})

fastify.post("/", async (req: FastifyRequest<{
	Body: APIInteraction;
	Headers: {
		"x-signature-ed25519": string;
		"x-signature-timestamp": string;
	};
}>, res: FastifyReply) => {
	log.debug('Recived Interaction: ', req.body.token)

	const signature = req.headers["x-signature-ed25519"]
	const timestamp = req.headers["x-signature-timestamp"]
	const body = JSON.stringify(req.body)

	if(!(await verify(body, signature, timestamp, config.discord.PUBLIC_KEY, webcrypto.subtle, PlatformAlgorithm.NewNode ))) {
		log.error("Failed to validate signature: ", req.body.token)
		return res.code(401).send("Invalid Signature")
	}

	const interaction = req.body;

	if(interaction.type == InteractionType.Ping) {
		log.debug("Sending Pong")
		return res.send({ type: InteractionResponseType.Pong })
	}

	await res.send({
		type: InteractionResponseType.ChannelMessageWithSource,
		data: { content: "Hello World!", flags: 1 << 6 }
	});
});

fastify.listen({ port: config.fastify.PORT }, (err, address) => {
	if(err) return log.fatal(err);

	log.info(`Listening on ${address}`)
});

export const REST = new RestClient().setToken(config.discord.TOKEN)