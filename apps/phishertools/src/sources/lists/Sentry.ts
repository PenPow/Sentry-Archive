import { Redis } from "../../config.js";
import type { Source } from "../sources.js";

// Dataset Source: Our own Data!
export const Sentry: Source = {
	name: 'Sentry',
	fetch: async () => {
		return Redis.smembers('sentry_domains');
	}
};