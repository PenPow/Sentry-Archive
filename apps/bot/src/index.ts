import "source-map-support/register.js";
import "./brokers.js";

import { webcrypto } from "node:crypto";
import {
  type APIInteraction,
  InteractionResponseType,
  InteractionType,
} from "discord-api-types/v10";
import { verify, PlatformAlgorithm } from "discord-verify/node";
import { type FastifyRequest, fastify as FastifyServer } from "fastify";
import { config, logger } from "./config.js";
import { Commands, loadCommands } from "./structures/Command.js";
import {
  CommandResponseType,
  getArgs,
  hasResponded,
  respond,
} from "./utils/helpers.js";
import { api } from "./REST.js";

const fastify = FastifyServer({
  logger: false,
});

fastify.post(
  "/",
  async (
    req: FastifyRequest<{
      Body: APIInteraction;
      Headers: {
        "x-signature-ed25519": string;
        "x-signature-timestamp": string;
      };
    }>,
    res
  ) => {
    const signature = req.headers["x-signature-ed25519"];
    const timestamp = req.headers["x-signature-timestamp"];
    const body = JSON.stringify(req.body);

    const signatureVerified = await verify(
      body,
      signature,
      timestamp,
      config.discord.PUBLIC_KEY,
      webcrypto.subtle,
      PlatformAlgorithm.NewNode
    );
    if (!signatureVerified) return res.code(401).send({});

    await loadCommands();

    if (req.body.type === InteractionType.Ping) {
      return void res.send({ type: InteractionResponseType.Pong });
    } else if (
      [
        InteractionType.ModalSubmit,
        InteractionType.ApplicationCommandAutocomplete,
        InteractionType.MessageComponent,
      ].includes(req.body.type)
    ) {
      // TODO: Implement these interaction types
      return void logger.fatal(
        "Attempted to handle an invalid interaction type"
      );
    } else if (req.body.type === InteractionType.ApplicationCommand) {
      const command = Commands.get(req.body.data.name);
      if (!command) return void res.code(404);

      const result = await command.execute({
        interaction: req.body,
        logger,
        // @ts-expect-error it works trust me
        getArgs,
        respond,
		api
      });

      const responded = hasResponded(req.body);

      if (responded && result) {
        await respond(req.body, CommandResponseType.FollowUp, result);
      } else if (!responded && result) {
        await respond(req.body, CommandResponseType.Reply, result);
      }

      return void res.status(200).send({});
    } else {
      void logger.fatal("Attempted to handle an unknown interaction type");
      return void res.status(500).send({});
    }
  }
);

// eslint-disable-next-line promise/prefer-await-to-callbacks
fastify.listen({ port: config.sentry.PORT, host: "::" }, (err, address) => {
  if (err) return logger.fatal(err);

  return logger.info(`Listening on ${address}`);
});
