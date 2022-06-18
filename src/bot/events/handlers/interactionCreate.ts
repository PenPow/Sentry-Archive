import { log, LogLevel } from "../../../common/logger.ts";
import { executeSlashCommand } from "../interactions/executeSlashCommand.ts";
import { bot } from "../../mod.ts";

export function setInteractionCreateEvent() {
  log(
    { level: LogLevel.Info, prefix: "InteractionCreate" },
    "Adding InteractionCreate Handler",
  );
  bot.events.interactionCreate = async (_, interaction) => {
    return await executeSlashCommand(bot, interaction);
  };
}
