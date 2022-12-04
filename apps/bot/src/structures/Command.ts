import type { API } from "@discordjs/core";
import type {
    APIApplicationCommandOption,
    APIChatInputApplicationCommandInteraction,
    APIMessageApplicationCommandInteraction,
    APIUserApplicationCommandInteraction,
    ApplicationCommandType,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
    RESTPostAPIContextMenuApplicationCommandsJSONBody,
    RESTPostAPIWebhookWithTokenJSONBody,
} from "discord-api-types/v10";
import glob from "glob";
import type { Logger } from "tslog";
import type { ApplicationCommandFetchedOptionType, CommandInteractionsUnion, DataType, ValidDataTypes } from "../utils/helpers.js";

export const Commands: Map<string, Handler<ApplicationCommandType>> = new Map();

export async function loadCommands() {
  if (Commands.size !== 0) return;

  const globbed: string[] = await new Promise((resolve) => {
    glob(`dist/commands/**/*`, (_err, files) => resolve(files));
  });

  for (const action of globbed) {
    if (!action.endsWith(".js")) continue;

    const commandExport: Handler<ApplicationCommandType> = (
      await import(`../${action.replace("dist", "")}`)
    ).default;

    // @ts-expect-error this works fine its just because SlashCommand is abstract to prevent instantiation, this is guaranteed to be a sub-class
    const Command: SlashCommand<ApplicationCommandType> = new commandExport();
    Commands.set(Command.data.name, Command);
  }
}

export abstract class Handler<T extends ApplicationCommandType> {
  public data!: T extends ApplicationCommandType.ChatInput
    ? RESTPostAPIChatInputApplicationCommandsJSONBody
    : RESTPostAPIContextMenuApplicationCommandsJSONBody;

  public options!: Record<string, Omit<APIApplicationCommandOption, "name">>;

  public type!: T; // Note: This doesnt exist at runtime, and is a hack to get RunContext to work, DO NOT ACCESS

  public async execute(_args: RunContext<any>): Returnable {
    throw new Error("Not Implemented");
  }

  public toJSON(): T extends ApplicationCommandType.ChatInput
    ? RESTPostAPIChatInputApplicationCommandsJSONBody
    : RESTPostAPIContextMenuApplicationCommandsJSONBody {
    // if(!this.validateOptions()) return;

    const transformed: APIApplicationCommandOption[] = [];

    for (const [key, value] of Object.entries(this.options)) {
      // @ts-expect-error idk why this is happening
      transformed.push({ ...value, name: key });
    }

    return {
      ...this.data,
      options: transformed,
    };
  }

  // private validateOptions(): boolean {
  // 	return s.record(s.record(s.unknown)).parse(this.options)
  // }
}

export type RunContext<Command extends Handler<ApplicationCommandType>> = {
  api: API;
  getArgs<Name extends keyof Command["options"]>(
	interaction: CommandInteractionsUnion,
    argument: Name
  ): Awaitable<
    Command["options"][Name]["required"] extends true
      ? ApplicationCommandFetchedOptionType<Command["options"][Name]["type"]>
      : ApplicationCommandFetchedOptionType<
          Command["options"][Name]["type"]
        > | null
  >;
  interaction: Command["type"] extends ApplicationCommandType.ChatInput
    ? APIChatInputApplicationCommandInteraction
    : Command["type"] extends ApplicationCommandType.Message
    ? APIMessageApplicationCommandInteraction
    : APIUserApplicationCommandInteraction;
  logger: Logger<unknown>;
  respond<Interaction extends Command["type"] extends ApplicationCommandType.ChatInput ? APIChatInputApplicationCommandInteraction : Command["type"] extends ApplicationCommandType.Message ? APIMessageApplicationCommandInteraction : APIUserApplicationCommandInteraction, Type extends ValidDataTypes<Interaction>>(
    interaction: Interaction,
    responseType: Type,
    data: DataType<Type>
  ): Promise<void>;
};

type Awaitable<T> = Promise<T> | T;
// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export type Returnable = Promise<RESTPostAPIWebhookWithTokenJSONBody | void>;
