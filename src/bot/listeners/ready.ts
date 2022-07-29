import crypto from "node:crypto";
import { DEVELOPMENT } from "../../common/config.js";
import { redis } from "../../common/db.js";
import { log, LogLevel } from "../../common/logger.js";
import type { IListener } from "../structures/Listener.js";

const reloadDomains = async () => {
	await redis.del('malicious-domains');
	const request = await fetch(new URL("https://phish.sinking.yachts/v2/all"), { headers: { "X-Identity": 'Sentry Discord Bot' } });

	const domains: string[] = await request.json() as string[];
	const hashed: string[] = [];

	for (const domain of domains) {
		hashed.push(crypto.createHash("sha512").update(domain).digest("hex"));
	}

	// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
	await redis.sadd('malicious-domains', ...hashed);
};

const readyEvent: IListener = {
	execute: function(client) {
		client.once("ready", async () => {
			log({ prefix: 'Ready', level: LogLevel.Success }, "Client is Ready");

			// TODO: RE-ENABLE THIS IN PRODUCTION
			if (DEVELOPMENT) await reloadDomains();

			// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-misused-promises
			setInterval(reloadDomains, 172800000);
		});
	}
};

export default readyEvent;
