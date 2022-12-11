import CertStreamClient from "certstream";
import ctph from "ctph.js";
import { logger, Redis } from "../config.js";

// Stub type definition containing just info i need
type CertStreamData = {
	data: {
		leaf_cert: {
			all_domains: string[]
		}
	},
	message_type: "certificate_update" | "heartbeat"
}

const threshold = 70;
const hashedDomains = await Redis.smembers("scam_domain_hashes");

const handleMessage = async (message: CertStreamData) => {
	if(message.message_type !== "certificate_update") return;

	for(const domain of message.data.leaf_cert.all_domains) {
		const digested = ctph.digest(domain);

		for(const hashed of hashedDomains) {
			if(ctph.similarity(hashed, digested) > threshold) {
				await Redis.sadd("sentry_domains", domain);
			} 
		}
	}
};

export function initCT() { 
	new CertStreamClient(handleMessage).connect(); 
}