import type { Source } from "../sources.js";

// Dataset Source: https://github.com/blocklistproject/List
export const BlockListProject: Source = {
	name: 'Block List Project',
	fetch: async () => {
		const urls: string[] = ["https://blocklistproject.github.io/Lists/alt-version/abuse-nl.txt", "https://blocklistproject.github.io/Lists/alt-version/crypto-nl.txt", "https://blocklistproject.github.io/Lists/alt-version/drugs-nl.txt", "https://blocklistproject.github.io/Lists/alt-version/piracy-nl.txt", "https://blocklistproject.github.io/Lists/alt-version/ransomware-nl.txt", "https://blocklistproject.github.io/Lists/alt-version/scam-nl.txt", "https://blocklistproject.github.io/Lists/alt-version/tracking-nl.txt", "https://blocklistproject.github.io/Lists/alt-version/fraud-nl.txt", "https://blocklistproject.github.io/Lists/alt-version/malware-nl.txt", "https://blocklistproject.github.io/Lists/alt-version/phishing-nl.txt"];
		const data: Promise<Response>[] = [];

		for(const url of urls) data.push(fetch(url));
		
		const settled = await Promise.all(data);

		const transformed: string[] = [];

		for(const list of settled) {
			const domains = (await list.text() as string).split('\n').filter((line) => !line.startsWith("#"));

			for(const domain of domains) transformed.push(domain);
		}
		
		return transformed;
	}
};