import { log, LogLevel } from "../../common/logger.js";
import type { IListener } from "../structures/Listener.js";

const debugEvent: IListener = {
	execute: function(client) {
		client.on("debug", (msg: string) => {
			log({ prefix: 'Debug Listener', level: LogLevel.Debug }, msg);
		});
	}
};

export default debugEvent;
