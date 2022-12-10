import csv from 'neat-csv';
import type { Source } from "../sources.js";

// Dataset Source: https://github.com/D09r/malvertising
export const malvertising: Source = {
	name: 'malvertising',
	fetch: async () => {
		const url = "https://raw.githubusercontent.com/D09r/malvertising/master/scam-domains.csv";
		const res = await fetch(url);
		const data = await res.text();

		const parsed = await csv(data);
		const domains: string[] = [];

		for(const row of parsed) {
			domains.push(row.domain!);
		}

		return domains;
	}
};