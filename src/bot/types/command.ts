import { ApplicationCommandOptionType } from "https://raw.githubusercontent.com/discordjs/discord-api-types/main/deno/v10.ts";
import {
  ApplicationCommandTypes,
  Bot,
  Interaction,
  PermissionStrings,
  types,
} from "@deps";
import { Locale, translationKeys } from "../languages/translate.ts";

export interface Command {
  /** The name of the command, used for both slash and message commands. */
  name: translationKeys;
  /** The type of command. */
  type?: ApplicationCommandTypes;
  /** The description of the command*/
  description: translationKeys;
  // TODO: consider type being a string like "number" | "user" for better ux
  /** The options for the command, used for both slash and message commands. */
  // options?: ApplicationCommandOption[];
  options?: ISlashCommandOption[];
  execute: (
    bot: Bot,
    data: Interaction,
  ) => unknown;

  /** Whether or not this slash command should be enabled right now. Defaults to true. */
  enabled?: boolean;
  /** Whether or not this command is still in development and should be setup in the dev server for testing. */
  dev?: boolean;
  /** Whether or not this command will take longer than 3s and need to acknowledge to discord. */
  acknowledge?: boolean;

  botServerPermissions?: PermissionStrings[];
  botChannelPermissions?: PermissionStrings[];
  userServerPermissions?: PermissionStrings[];
  userChannelPermissions?: PermissionStrings[];

  raw?: types.RESTPostAPIApplicationCommandsJSONBody;
}

export interface ISlashCommandOption {
  type: ApplicationCommandOptionType;
  name: translationKeys;
  name_localizations?: Record<Locale, string>;
  description: translationKeys;
  description_localizations?: Record<Locale, string>;
  required?: boolean;
  choices?: {
    name: string;
    name_localizations?: Record<Locale, string>;
    value: string | number;
  }[];
  autocomplete?: boolean;
}

export interface IRESTSlashCommandOption
  extends Omit<ISlashCommandOption, "name" | "description"> {
  name: string;
  description: string;
}
