import csv from 'neat-csv';
import type { Source } from "../sources.js";

// Dataset Source: https://phishtank.org
export const PhishTank: Source = {
	name: 'PhishTank',
	fetch: async () => {
		const url = "http://data.phishtank.com/data/online-valid.csv"; // NOTE: PhishTank requests an application key for automatic fetching, but atm they have disabled registrations, in the future, reformat this to use a key
		const res = await fetch(url);
		const data = await res.text();

		const parsed = await csv(data);
		const domains: string[] = [];

		for(const row of parsed) {
			domains.push(row.url!);
		}

		return domains;
	}
};