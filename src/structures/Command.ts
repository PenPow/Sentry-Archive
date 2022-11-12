import { ApplicationCommandType, RESTPostAPIChatInputApplicationCommandsJSONBody, RESTPostAPIContextMenuApplicationCommandsJSONBody } from "discord-api-types/v10";

export type Command =  {
	type: ApplicationCommandType.ChatInput
	json: RESTPostAPIChatInputApplicationCommandsJSONBody,
	execute: () => void
} | { 
	type: ApplicationCommandType.Message | ApplicationCommandType.User,
	json: RESTPostAPIContextMenuApplicationCommandsJSONBody,
	execute: () => void
}