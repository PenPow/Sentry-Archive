import type { Source } from "../sources.js";

// Dataset Source: https://github.com/Dogino/Discord-Phishing-URLs
export const Dogino: Source = {
	name: 'Dogino',
	fetch: async () => {
		const url = "https://raw.githubusercontent.com/Dogino/Discord-Phishing-URLs/main/pihole-phishing-adlist.txt";

		const data = await (await fetch(url)).text();

		return data.split('\n').filter((line) => !line.startsWith('#')).map((entry) => entry.replace('0.0.0.0 ', ''));
	}
};