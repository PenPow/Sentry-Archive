import type { Source } from "../sources.js";

// Dataset Source: https://phish.sinking.yachts
export const SinkingYachts: Source = {
	name: 'SinkingYachts',
	fetch: async () => {
		const url = "https://phish.sinking.yachts/v2/text";

		const data = await (await fetch(url, { headers: { 'X-Identity': 'Sentry Discord Bot' }})).text();

		return data.split('\n');
	}
};