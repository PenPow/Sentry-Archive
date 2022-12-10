import type { Source } from "../sources.js";

// Dataset Source: https://github.com/mhhakim/pihole-blocklist
export const PiholeBlocklist: Source = {
	name: 'PiholeBlocklist',
	fetch: async () => {
		const urls: string[] = ["https://raw.githubusercontent.com/mhhakim/pihole-blocklist/master/custom-blocklist.txt", "https://raw.githubusercontent.com/mhhakim/pihole-blocklist/master/custom-porn-blocklist.txt", "https://raw.githubusercontent.com/mhhakim/pihole-blocklist/master/list.txt", "https://raw.githubusercontent.com/mhhakim/pihole-blocklist/master/nxdomain.txt", "https://raw.githubusercontent.com/mhhakim/pihole-blocklist/master/porn.txt"];
		const data: Promise<Response>[] = [];

		for(const url of urls) data.push(fetch(url));
		
		const settled = await Promise.all(data);

		const transformed: string[] = [];

		for(const list of settled) {
			const domains = (await list.text() as string).split('\n').filter((val) => !val.startsWith("#") || val === "");

			for(const domain of domains) transformed.push(domain);
		}
		
		return transformed;
	}
};