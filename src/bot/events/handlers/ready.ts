import { log, LogLevel } from "../../../common/logger.ts";
import { bot } from "../../mod.ts";

export function setReadyEvent() {
  log(
    { level: LogLevel.Info, prefix: "Ready" },
    "Adding Ready Handler",
  );
  bot.events.ready = () => {
    log(
      { level: LogLevel.Sucess, prefix: "Ready" },
      `Client Ready`,
    );
  };
}
