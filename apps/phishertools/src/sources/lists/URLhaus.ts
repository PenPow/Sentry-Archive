import type { Source } from "../sources.js";

// Dataset Source: https://urlhaus.abuse.ch/
export const URLhaus: Source = {
	name: 'URLhaus',
	fetch: async () => {
		const url = "https://urlhaus.abuse.ch/downloads/text/";
		const response = await fetch(url);
		return (await response.text()).split('\n').filter((val) => !val.startsWith('#')).map((domain) => domain.replace('https://', '').replace('http://', ''));
	}
};