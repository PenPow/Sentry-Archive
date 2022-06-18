import {
  Bot,
  Interaction,
  InteractionApplicationCommandCallbackData,
  InteractionResponseTypes,
} from "../../deps.ts";

export async function replyToInteraction(
  bot: Bot,
  payload: Interaction,
  options:
    | string
    | (InteractionApplicationCommandCallbackData & {
      /** Type of the reply */
      type?: InteractionResponseTypes;
    }),
) {
  if (typeof options === "string") options = { content: options };

  return await bot.helpers.sendInteractionResponse(payload.id, payload.token, {
    type: options.type ?? InteractionResponseTypes.ChannelMessageWithSource,
    data: options,
  });
}

export async function ephemeral(
  bot: Bot,
  payload: Interaction,
  options:
    | string
    | (InteractionApplicationCommandCallbackData & {
      /** Type of the reply */
      type?: InteractionResponseTypes;
    }),
) {
  if (typeof options === "string") options = { content: options };
  options.flags = 64;

  return await replyToInteraction(bot, payload, { ...options });
}
