import ctph from "ctph.js";
import cron from "node-cron";
import { Redis, logger } from "../config.js";
import { Sources } from "../sources/sources.js";

cron.schedule("0 3 * * *", reloadSources);

export async function reloadSources() {
	const promises: Promise<string[]>[] = [];

	for(const source of Sources) promises.push(source.fetch());

	const resolved = await Promise.allSettled(promises);
	const successful: string[][] = [];

	// eslint-disable-next-line unicorn/no-array-for-each
	resolved.forEach((data, idx) => {
		if(data.status === 'rejected') {
			logger.warn(`Failed to load ${Sources[idx]!.name}: ${data.reason}`);
			return;
		}

		successful.push(data.value);
	});

	const domains: string[] = [];

	await Redis.del('scam_domains_hash');

	for(const list of successful) {
		for(const domain of list) domains.push(domain);
	}
	
	const hashes: string[] = [];

	for(const domain of domains) hashes.push(ctph.digest(domain));

	await Redis.sadd("scam_domain_hashes", hashes);
}