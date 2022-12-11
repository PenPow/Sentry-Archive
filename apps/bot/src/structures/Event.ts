import type { API } from "@discordjs/core";
import type { APIMessage } from "discord-api-types/v10";
import type { Logger } from "tslog";

/**
 * Enum of all events that we handle
 *
 * @public
 */
export enum EventType {
  MessageCreate,
}

/**
 * Context for the listener containing useful properties
 *
 * @typeParam Type - One of the {@link EventType}s for the run context to provide specific type hints
 * @public
 */
export type EventListenerRunContext<Type extends EventType> = {
  api: API;
  data: EventTypeToFunctionDefinition<Type>;
  logger: Logger<unknown>;
};

/**
 * Utility type to convert a {@link EventType} to its appropriate data type
 *
 * @typeParam Type - One of the {@link EventType}s to get the data for
 * @internal
 */
type EventTypeToFunctionDefinition<Type extends EventType> =
  Type extends EventType.MessageCreate ? APIMessage : never;

/**
 * Type Definiton for a listener
 *
 * @typeParam Type - One of the {@link EventType}s for the run context to provide specific type hints
 * @public
 */
export type EventListener<Event extends EventType> = {
  run(context: EventListenerRunContext<Event>): Promise<void>;
};
