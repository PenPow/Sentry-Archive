import type { API } from "@discordjs/core";
import type { Result } from "@sapphire/result";
import type {
  APIApplicationCommandOption,
  APIChatInputApplicationCommandInteraction,
  APIMessageApplicationCommandInteraction,
  APIModalSubmitInteraction,
  APIUserApplicationCommandInteraction,
  ApplicationCommandType,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  RESTPostAPIContextMenuApplicationCommandsJSONBody,
  RESTPostAPIWebhookWithTokenJSONBody,
} from "discord-api-types/v10";
import glob from "glob";
import type { Logger } from "tslog";
import type {
  ApplicationCommandFetchedOptionType,
  CommandInteractionsUnion,
  DataType,
  ValidDataTypes,
} from "../utils/helpers.js";

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
    const Command: Handler<ApplicationCommandType> = new commandExport();
    Commands.set(Command.data.name, Command);
  }
}

/**
 * Abstract class to represent a slash command
 *
 * @public
 * @typeParam T - Which {@link ApplicationCommandType} to handle
 */
export abstract class Handler<T extends ApplicationCommandType> {
  /**
   * The data which the command registers, depending on the type of command (ChatInput or ContextMenu) it is either {@link RESTPostAPIChatInputApplicationCommandsJSONBody} or {@link RESTPostAPIContextMenuApplicationCommandsJSONBody}
   * 
   * @public
   */
  public data!: T extends ApplicationCommandType.ChatInput
    ? Omit<RESTPostAPIChatInputApplicationCommandsJSONBody, "options">
    : RESTPostAPIContextMenuApplicationCommandsJSONBody;

  /**
   * The options which the command registers, which is a record of option names to their values
   * 
   * @public
   */
  public options!: {
    [string: string]: Omit<APIApplicationCommandOption, "name">;
  };

  /**
   * This is a stub to get some {@link RunContext} shenanigans to work
   *
   * @remarks Do not access at runtime
   * @deprecated ⚠️ Do not access this property. This is a stub that is used as a hack to get {@link RunContext} to work properly. This does not exist at runtime and never will do
   */
  public type!: T; // Note: This doesnt exist at runtime, and is a hack to get RunContext to work, DO NOT ACCESS

  /**
   * Function that gets executed when the command is run
   * 
   * @remarks This function should be overriden at runtime   * 
   * @param _args - The context that it needs to run in
   * @virtual
   * @returns Optional return value of data that should be sent as either the initial reply, or as a follow up
   */
  public async execute(_args: RunContext<any>): Returnable {
    throw new Error("Not Implemented");
  }

  /**
   * Function to handle modal
   * 
   * @remarks This function should be overriden at runtime   * 
   * @param _args - The context that it needs to run in
   * @virtual
   */
  public async handleModal(_args: Omit<RunContext<any>, "getArgs" | "interaction"> & { interaction: APIModalSubmitInteraction }): Promise<void> {
	// eslint-disable-next-line no-useless-return
	return;
  }

  /**
   * Utility function to convert a command to have its JSON data, so it can be registered at discord
   * 
   * @internal
   * @sealed
   * @returns The JSON data for the command
   */
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

/**
 * Utility type to represent the return type of a command execution
 * 
 * @public
 */
export type Returnable = Promise<RESTPostAPIWebhookWithTokenJSONBody | void>; // eslint-disable-line @typescript-eslint/no-invalid-void-type

/**
 * The context in which the command executes
 * 
 * @public
 * @typeParam Command - The command which the context refers to
 */
export type RunContext<Command extends Handler<ApplicationCommandType>> = {
  api: API;
  getArgs<Name extends keyof Command["options"]>(
    interaction: CommandInteractionsUnion,
    argument: Name
  ): 
    Command["options"][Name]["required"] extends true
      ? ApplicationCommandFetchedOptionType<Command["options"][Name]["type"]>
      : ApplicationCommandFetchedOptionType<
          Command["options"][Name]["type"]
        > | null;
  interaction: Command["type"] extends ApplicationCommandType.ChatInput
    ? APIChatInputApplicationCommandInteraction
    : Command["type"] extends ApplicationCommandType.Message
    ? APIMessageApplicationCommandInteraction
    : APIUserApplicationCommandInteraction;
  logger: Logger<unknown>;
  respond<
    Interaction extends CommandInteractionsUnion,
    Type extends ValidDataTypes<Interaction>
  >(
    interaction: Interaction,
    responseType: Type,
    data: DataType<Type>
  ): Promise<Result<true, Error>>;
};