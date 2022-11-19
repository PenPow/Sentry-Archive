import type { APIApplicationCommandOption, APIChatInputApplicationCommandInteraction, APIMessageApplicationCommandInteraction, APIUserApplicationCommandInteraction, ApplicationCommandType, RESTPostAPIChatInputApplicationCommandsJSONBody, RESTPostAPIContextMenuApplicationCommandsJSONBody } from "discord-api-types/v10";
import glob from "glob";

export const Commands: Map<string, SlashCommand<ApplicationCommandType>> = new Map()

export async function loadCommands() {
	if(Commands.size != 0) return;

	const globbed: string[] = await new Promise(((resolve) => { 
		glob(`src/commands/**/*`, (_err, files) => resolve(files));
	}))
	
	for(const action of globbed) {
		const commandExport: SlashCommand<ApplicationCommandType> = (await import(`../${action.replace('.ts', '.js').replace('src/', '')}`)).default
	
		// @ts-expect-error this works fine its just because SlashCommand is abstract to prevent instantiation, this is guaranteed to be a sub-class
		const Command: SlashCommand<ApplicationCommandType> = new commandExport()
		Commands.set(Command.data.name, Command)
	}
}

loadCommands()

export abstract class SlashCommand<T extends ApplicationCommandType> {
	// FIXME: LOOK BACK EVERY SO OFTEN SO I CAN REPLACE TS-IGNORE WITH TS-EXPECT-ERRORS
	// @ts-ignore this works + vscode isnt detecting errors here despite tsc doing so? so ts-ignore
	public data: (T extends ApplicationCommandType.ChatInput ? RESTPostAPIChatInputApplicationCommandsJSONBody : RESTPostAPIContextMenuApplicationCommandsJSONBody)
	// @ts-ignore this works + vscode isnt detecting errors here despite tsc doing so? so ts-ignore
	public options: Record<string, Omit<APIApplicationCommandOption, 'name'>>
	// @ts-ignore this works + vscode isnt detecting errors here despite tsc doing so? so ts-ignore
	public type: T

	public execute({}: RunContext<any>) {
		throw new Error("Not Implemented")
	}

	public toJSON(): (T extends ApplicationCommandType.ChatInput ? RESTPostAPIChatInputApplicationCommandsJSONBody : RESTPostAPIContextMenuApplicationCommandsJSONBody) {
		// if(!this.validateOptions()) return;

		const transformed: APIApplicationCommandOption[] = []

		for(const [key, value] of Object.entries(this.options)) {
			// @ts-expect-error idk why this is happening
			transformed.push({ ...value, name: key })
		}

		return {
			...this.data,
			options: transformed
		}
	}

	// private validateOptions(): boolean {
	// 	return s.record(s.record(s.unknown)).parse(this.options)
	// }
}

export interface RunContext<Command extends SlashCommand<ApplicationCommandType>> {
	data: Command["data"]
	getArgs: <Name extends keyof Command["options"]>(interaction: Name) => Command["options"][Name]["type"],
	interaction: Command["type"] extends ApplicationCommandType.ChatInput ? APIChatInputApplicationCommandInteraction : Command["type"] extends ApplicationCommandType.Message ? APIMessageApplicationCommandInteraction : APIUserApplicationCommandInteraction 
}