import type { Source } from "../sources.js";

// Dataset Source: https://github.com/WalshyDev/Discord-bad-domains
export const WalshyDev: Source = {
	name: 'WalshyDev',
	fetch: async () => {
		const url = "https://raw.githubusercontent.com/WalshyDev/Discord-bad-domains/main/domains.txt";
		const response = await fetch(url);
		return (await response.text()).split('\n');
	}
};