import type { Action } from "../interval.js";
import { ctx, io } from "@interval/sdk";
import glob from "glob";
import { Command } from "../structures/Command.js";
import { REST } from "../server.js";
import { Routes } from "discord-api-types/v10";
import { config } from "../utils.js";

export default {
	name: 'Deploy',
	execute: async () => {
		const commands: string[] = await new Promise(((resolve) => { 
			glob(`src/commands/**/*`, (_err, files) => resolve(files));
		}))
		
		const toRegister: Command[] = []
		
		for(const command of commands) {
			const exports: Command = (await import(`../${command.replace('.ts', '.js').replace('src/', '')}`)).default
		
			toRegister.push(exports)
		}

		const [table, registerToGuild] = await io.group([
			io.select.table("Commands", {
				data: toRegister.map((data, index) => { return { id: index, name: data.json.name } })
			}),
			io.input.boolean("Register Guild Commands?").optional()
		])

		if(table.length === 0) throw new Error("You have to specify some commands to register!")

		const selected = toRegister.filter((_value, index) => table.some((data) => data.id == index));

		ctx.log(selected)

		if(registerToGuild) {
			const guildId = await io.input.text("Enter Guild ID: ", { minLength: 17, maxLength: 19 });

			await ctx.loading.start({ title: 'Registering Commands '})

			// await REST.put(Routes.applicationGuildCommands(Buffer.from(config.discord.TOKEN.split('.')[0], 'base64').toString(), guildId), { body: selected })
		};

		await ctx.loading.start({ title: 'Registering Commands '})

		// await REST.put(Routes.applicationCommands(Buffer.from(config.discord.TOKEN.split('.')[0], 'base64').toString()), { body: selected })
	}
} as Action