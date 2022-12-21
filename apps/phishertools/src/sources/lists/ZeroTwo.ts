import type { Source } from "../sources.js";

// Dataset Source: https://github.com/ByteAlex/anti-fish-lists
export const ZeroTwo: Source = {
	name: 'ZeroTwo',
	fetch: async () => {
		const urls = ["https://raw.githubusercontent.com/ByteAlex/anti-fish-lists/main/blocklist.urls.json", "https://raw.githubusercontent.com/ByteAlex/anti-fish-lists/main/blocklist.domains.json"];

		const data: Promise<Response>[] = [];

		for(const url of urls) data.push(fetch(url));
		
		const settled = await Promise.all(data);

		const transformed: string[] = [];

		for(const list of settled) {
			const domains = (await list.json())[0].list;

			for(const domain of domains) transformed.push(domain);
		}
		
		return transformed;
	}
};