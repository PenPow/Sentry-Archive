import type { API } from "@discordjs/core";
import type { APIMessage } from "discord-api-types/v10";
import type { Logger } from "tslog";

export enum EventType {
	MessageCreate
}

export type EventListenerRunContext<Type extends EventType> = {
	api: API;
	data: EventTypeToFunctionDefinition<Type>,
	logger: Logger<unknown>;
}

type EventTypeToFunctionDefinition<Type extends EventType> =
	Type extends EventType.MessageCreate ? APIMessage :
	never

export type EventListener<Event extends EventType> = {
	run(context: EventListenerRunContext<Event>): Promise<void>
}