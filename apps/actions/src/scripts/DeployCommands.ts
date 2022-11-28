import { Buffer } from "node:buffer";
import { ctx, io } from "@interval/sdk";
import { Routes, ApplicationCommandType, type RESTPostAPIChatInputApplicationCommandsJSONBody, type RESTPostAPIContextMenuApplicationCommandsJSONBody} from "discord-api-types/v10";
import { Broker, config, REST } from "../config.js";
import type { Action } from "../types.js";

export default {
  name: "DeployCommands",
  execute: async () => {
    const Commands: (RESTPostAPIChatInputApplicationCommandsJSONBody | RESTPostAPIContextMenuApplicationCommandsJSONBody)[] = await Broker.call('getCommands', null);

    if(!Commands) throw new Error("No Commands Loaded!");

    const [table, registerToGuild] = await io.group([
      io.select.table("Commands", {
        data: [...Commands.values()].map((data, index) => {
          return { id: index, name: data.name, description: data.type === ApplicationCommandType.ChatInput ? data.description : '-', type: data.type === ApplicationCommandType.ChatInput ? 'Chat Input' : 'Context Menu' };
        }),
      }),
      io.input.boolean("Register Guild Commands?").optional(),
    ]);

    if (table.length === 0)
      throw new Error("You have to specify some commands to register!");

    const selectedCommands = [...Commands.values()].filter((_value, index) =>
      table.some((data) => data.id === index)
    );

    if (registerToGuild) {
      const guildId = await io.input.text("Enter Guild ID: ", {
        minLength: 17,
        maxLength: 19,
      });

      await ctx.loading.start({ title: "Registering Commands " });

      await REST.put(
        Routes.applicationGuildCommands(
          Buffer.from(config.discord.TOKEN.split(".")[0]!, "base64").toString(),
          guildId
        ),
        { body: selectedCommands }
      );
    }

    await ctx.loading.start({ title: "Registering Commands " });

    await REST.put(
      Routes.applicationCommands(
        Buffer.from(config.discord.TOKEN.split(".")[0]!, "base64").toString()
      ),
      { body: selectedCommands }
    );
  },
} as Action;
