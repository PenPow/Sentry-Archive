import {
  Bot,
  Interaction,
  InteractionResponseTypes,
  InteractionTypes,
  sendPrivateInteractionResponse,
} from "../../../../deps.ts";
import { log, LogLevel } from "../../../common/logger.ts";
import { replyToInteraction } from "../../../common/replies.ts";
import { Locale, translate } from "../../languages/translate.ts";
import { Command } from "../../types/command.ts";
import commands from "./mod.ts";

export async function executeSlashCommand(bot: Bot, interaction: Interaction) {
  if (interaction.type === InteractionTypes.ApplicationCommand) {
    const data = interaction.data;
    const name = data?.name as keyof typeof commands;

    const command: Command | undefined = commands[name];

    if (!command?.execute) {
      return await sendPrivateInteractionResponse(
        bot,
        interaction.id,
        interaction.token,
        {
          type: InteractionResponseTypes.ChannelMessageWithSource,
          data: {
            content: translate(
              interaction.locale as Locale ?? "en-GB",
              "COMMAND_NOT_FOUND",
            ),
          },
        },
      ).catch((err) =>
        log(
          { level: LogLevel.Error, prefix: "Interaction Handler" },
          err.message,
        )
      );
    }

    try {
      if (command.acknowledge) {
        await replyToInteraction(bot, interaction, {
          type: InteractionResponseTypes.DeferredChannelMessageWithSource,
        });
      }

      await command.execute(bot, interaction);
    } catch (err) {
      log(
        { level: LogLevel.Error, prefix: "Interaction Handler" },
        err.message,
      );

      return await sendPrivateInteractionResponse(
        bot,
        interaction.id,
        interaction.token,
        {
          type: InteractionResponseTypes.ChannelMessageWithSource,
          data: {
            content: translate(
              interaction.locale as Locale ?? "en-GB",
              "COMMAND_ERROR",
            ),
          },
        },
      ).catch((err) =>
        log(
          { level: LogLevel.Error, prefix: "Interaction Handler" },
          err.message,
        )
      );
    }
  }
}
