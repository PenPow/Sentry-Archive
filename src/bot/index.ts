import "source-map-support/register.js";
import { init as intervalInit } from "./interval.js";
import { init as proxyInit } from "./ws.js"

import { type FastifyReply, type FastifyRequest, fastify as FastifyServer } from 'fastify';
import { verify, PlatformAlgorithm } from "discord-verify/node";
import { type APIInteraction, InteractionResponseType, InteractionType, MessageFlags, ApplicationCommandOptionType, APIApplicationCommandInteractionDataBasicOption, ApplicationCommandType, Routes, APIChannel, APIRole, APIGroupDMChannel, APIDMChannel, APIUser, APIAttachment } from "discord-api-types/v10";
import { webcrypto } from "node:crypto";
import { config, logger } from '../common/utils.js';
import { REST as RestClient } from "@discordjs/rest";
import { Commands, loadCommands } from "./structures/Command.js";

intervalInit()
proxyInit()

const fastify = FastifyServer({
  logger: false
})

// @ts-expect-error all code paths return a value
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

	await loadCommands()

	const interaction = req.body;

	let responded: boolean | "defer" = false;

	switch(interaction.type) {
		case InteractionType.Ping:
			logger.debug("Sending Pong")
			return res.send({ type: InteractionResponseType.Pong })
		case InteractionType.ModalSubmit:
		case InteractionType.MessageComponent:
		case InteractionType.ApplicationCommandAutocomplete:
			return res.send({ type: InteractionResponseType.ChannelMessageWithSource, data: { content: 'Not Implemented', flags: MessageFlags.Ephemeral }})
		case InteractionType.ApplicationCommand:
			const command = Commands.get(interaction.data.name);

			if(!command) return res.code(404).send("No Command Found")

			const execute = await command.execute({ 
				interaction,
				logger,
				data: command.data,
				getArgs: async (name) => {
					if(interaction.type != InteractionType.ApplicationCommand) throw new TypeError("Getting Args of Non Application Command")
					if([ApplicationCommandType.Message, ApplicationCommandType.User].includes(interaction.data.type)) throw new TypeError("Getting Args of Chat Input Command") 
					if("options" in interaction.data) {
						const option = (interaction.data.options!.filter((val) => ![ApplicationCommandOptionType.Subcommand, ApplicationCommandOptionType.SubcommandGroup].includes(val.type)).find((val) => val.name === name) as APIApplicationCommandInteractionDataBasicOption)

						if([ApplicationCommandOptionType.String, ApplicationCommandOptionType.Number, ApplicationCommandOptionType.Integer, ApplicationCommandOptionType.Boolean].includes(option.type)) return option.value;
						else if(option.type === ApplicationCommandOptionType.Attachment) return interaction.data.resolved?.attachments ? interaction.data.resolved.attachments[option.value] as APIAttachment : null
						else if([ApplicationCommandOptionType.Channel, ApplicationCommandOptionType.Role, ApplicationCommandOptionType.User].includes(option.type)) {
							if(option.type === ApplicationCommandOptionType.Channel) {
								const fetched: Exclude<APIChannel, APIGroupDMChannel | APIDMChannel> = (interaction.data.resolved?.channels && interaction.data.resolved?.channels[option.value] as Exclude<APIChannel, APIGroupDMChannel | APIDMChannel>) ?? await REST.get(Routes.channel(option.value)) as Exclude<APIChannel, APIGroupDMChannel | APIDMChannel>;

								return fetched
							} else if(option.type === ApplicationCommandOptionType.Role) {
								const fetched = (interaction.data.resolved?.roles && interaction.data.resolved?.roles[option.value]) ?? await REST.get(Routes.guildRole(interaction.guild_id!, option.value)) as APIRole;

								return fetched
							} else if(option.type === ApplicationCommandOptionType.User) {
								const fetched = (interaction.data.resolved?.users && interaction.data.resolved?.users[option.value]) ?? await REST.get(Routes.user(option.value)) as APIUser;

								return fetched
							}
						}
					}

					return null
				},
				respond: async (int, type, data) => {
					if(responded) {
						return void await REST.post(Routes.interactionCallback(int.id, int.token), { body: data })
					}

					responded = type == InteractionResponseType.DeferredChannelMessageWithSource ? "defer" : true

					return void await res.send({ type: type, data })
				}
			})

			if(execute && (responded as boolean | "defer") == "defer") {
				return void await REST.patch(Routes.webhookMessage(interaction.application_id, interaction.token), { body: execute })
			}
			else if(execute && !responded) {
				return void await res.send({ type: InteractionResponseType.ChannelMessageWithSource, data: execute })
			} 

			if(!responded) throw new Error("No Response Given")
	}
});

fastify.listen({ port: config.fastify.PORT, host: '::' }, (err, address) => {
	if(err) return logger.fatal(err);

	return logger.info(`Listening on ${address}`)
});

export const REST = new RestClient({ version: "10", api: "http://rest:3000/api" }).setToken(config.discord.TOKEN)