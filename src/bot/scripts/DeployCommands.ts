import type { Action } from "../interval.js";
import { ctx, io } from "@interval/sdk";
import { Commands } from "../structures/Command.js";
import { REST } from "../server.js";
import { Routes } from "discord-api-types/v10";
import { config } from "../../common/utils.js";

export default {
	name: 'Deploy',
	execute: async () => {
		const [table, registerToGuild] = await io.group([
			io.select.table("Commands", {
				data: [...Commands.values()].map((data, index) => { return { id: index, name: data.data.name } })
			}),
			io.input.boolean("Register Guild Commands?").optional()
		])

		if(table.length === 0) throw new Error("You have to specify some commands to register!")

		const selectedCommands = [...Commands.values()].filter((_value, index) => table.some((data) => data.id == index));

		if(registerToGuild) {
			const guildId = await io.input.text("Enter Guild ID: ", { minLength: 17, maxLength: 19 });

			await ctx.loading.start({ title: 'Registering Commands '})

			await REST.put(Routes.applicationGuildCommands(Buffer.from(config.discord.TOKEN.split('.')[0]!, 'base64').toString(), guildId), { body: selectedCommands.map((command) => command.toJSON()) })
		};

		await ctx.loading.start({ title: 'Registering Commands '})

		await REST.put(Routes.applicationCommands(Buffer.from(config.discord.TOKEN.split('.')[0]!, 'base64').toString()), { body: selectedCommands.map((command) => command.toJSON()) })
	}
} as Action