import type { Source } from "../sources.js";

// Dataset Source: https://api.hyperphish.com/gimme-domains
export const HyperPhish: Source = {
	name: 'HyperPhish',
	fetch: async () => {
		const url = "https://api.hyperphish.com/gimme-domains";

		return (await fetch(url)).json();
	}
};