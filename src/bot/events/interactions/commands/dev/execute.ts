import { ApplicationCommandOptionType } from "https://raw.githubusercontent.com/discordjs/discord-api-types/main/deno/v10.ts";
import { DEV_USER_ID } from "@config";
import {
  ephemeral,
  replyToInteraction,
} from "../../../../../common/replies.ts";
import { Locale, translate } from "../../../../languages/translate.ts";
import { Command } from "../../../../types/command.ts";
import { avatarURL, Embed } from "../../../../../../deps.ts";

const command: Command = {
  name: "EXECUTE_COMMAND_NAME",
  dev: true,
  description: "EXECUTE_COMMAND_DESCRIPTION",
  acknowledge: true,
  options: [{
    name: "EXECUTE_COMMAND_OPTION_NAME",
    description: "EXECUTE_COMMAND_OPTION_DESCRIPTION",
    type: ApplicationCommandOptionType.String,
    required: true,
  }],
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

    const timestamp = Date.now();

    let codeToRun =
      interaction?.data?.options?.find((option) => option.name === "code")
        ?.value?.toString() ?? "";
    if (codeToRun.includes("await ")) {
      codeToRun = `(async () => {\n${codeToRun}\n})()`;
    }

    try {
      const evaled = await eval(codeToRun);

      const inspected = Deno.inspect(evaled, {
        depth: 0,
        getters: true,
      });

      const embed: Embed = {
        footer: {
          text: interaction.member?.nick ??
            interaction.user.username + "#" + interaction.user.discriminator,
          iconUrl: avatarURL(
            bot,
            interaction.user.id,
            interaction.user.discriminator,
          ),
        },
        timestamp: Date.now(),
        color: parseInt("5cff9d", 16),
        title: "Code Evaluation",
        fields: [{
          name: ":inbox_tray: Input",
          value: `\`\`\`js\n${codeToRun.substring(0, 1015)}\`\`\``,
        }, {
          name: ":outbox_tray: Output",
          value: `\`\`\`js\n${inspected.substring(0, 1015)}\`\`\``,
        }, {
          name: "Output Type",
          value: evaled?.constructor.name === "Array"
            ? `${evaled.constructor.name}<${evaled[0]?.constructor.name}>`
            : evaled?.constructor.name ?? typeof evaled,
          inline: true,
        }, {
          name: ":straight_ruler: Length",
          value: inspected.length.toString(),
          inline: true,
        }, {
          name: ":stopwatch: Time Taken",
          value: `${(Date.now() - timestamp).toLocaleString()}ms`,
          inline: true,
        }],
      };

      return void await ephemeral(bot, interaction, { embeds: [embed] });
    } catch (err) {
      const embed: Embed = {
        footer: {
          text: interaction.member?.nick ??
            interaction.user.username + "#" + interaction.user.discriminator,
          iconUrl: avatarURL(
            bot,
            interaction.user.id,
            interaction.user.discriminator,
          ),
        },
        timestamp: Date.now(),
        color: parseInt("ff5c5c", 16),
        title: "Code Evaluation",
        fields: [{
          name: ":inbox_tray: Input",
          value: `\`\`\`js\n${codeToRun.substring(0, 1015)}\`\`\``,
        }, {
          name: ":outbox_tray: Error",
          value: `\`\`\`js\n${err.stack.substring(0, 1015)}\`\`\``,
        }, {
          name: "Error Type",
          value: err.name,
          inline: true,
        }, {
          name: ":stopwatch: Time Taken",
          value: `${(Date.now() - timestamp).toLocaleString()}ms`,
          inline: true,
        }],
      };

      return void await ephemeral(bot, interaction, { embeds: [embed] });
    }
  },
};

export default command;
