import { DEV_USER_ID } from "@config";
import { registerLocaleCommands } from "../../../../../common/deploy.ts";
import { replyToInteraction } from "../../../../../common/replies.ts";
import { Locale, translate } from "../../../../languages/translate.ts";
import { Command } from "../../../../../common/command.ts";

const command: Command = {
  name: "DEPLOY_COMMAND_NAME",
  dev: true,
  description: "DEPLOY_COMMAND_DESCRIPTION",
  acknowledge: true,
  execute: async function (bot, interaction) {
    if (!DEV_USER_ID || interaction.user.id !== DEV_USER_ID) {
      return await replyToInteraction(
        bot,
        interaction,
        translate(
          interaction.locale as Locale,
          "COMMAND_ERROR",
        ),
      );
    }

    const deployed = await registerLocaleCommands(bot);
    return await replyToInteraction(
      bot,
      interaction,
      translate(
        interaction.locale as Locale,
        "DEPLOY_COMMAND_RESPONSE",
        deployed,
      ),
    );
  },
};

export default command;
