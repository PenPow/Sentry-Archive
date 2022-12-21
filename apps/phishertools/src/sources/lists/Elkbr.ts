import type { Source } from "../sources.js";

// Dataset Source: https://github.com/elbkr/bad-websites
export const Elkbr: Source = {
	name: 'Elkbr',
	fetch: async () => {
		const url = "https://raw.githubusercontent.com/elbkr/bad-websites/main/websites.json";

		return (await (await fetch(url)).json()).links;
	}
};