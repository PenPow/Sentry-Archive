import { setInteractionCreateEvent } from "./handlers/interactionCreate.ts";
import { setReadyEvent } from "./handlers/ready.ts";
import { setMessageCreateEvent } from "./handlers/messageCreate.ts";
import { log, LogLevel } from "../../common/logger.ts";

export function setupEventHandlers() {
  log({ level: LogLevel.Info, prefix: "Bot" }, "Adding Event Handlers!");
  setInteractionCreateEvent();
  setReadyEvent();
  setMessageCreateEvent();
}
