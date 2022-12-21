// // import CertStreamClient from "certstream";
// import ctph from "ctph.js";
// import { Redis } from "../config.js";

// // https://gist.github.com/jabney/5018b4adc9b2bf488696
// function shannonEntropy(str: string): number {
// 	const len = str.length;
   
// 	// Build a frequency map from the string.
// 	const frequencies = Array.from(str)
// 	// @ts-expect-error it works
// 	  // eslint-disable-next-line id-length, @typescript-eslint/restrict-plus-operands
// 	  .reduce((freq, c) => (freq[c] = (freq[c] || 0) + 1) && freq, {});
   
// 	// Sum the frequency of each character.
// 	// @ts-expect-error this works
// 	return Object.values(frequencies)
// 	// @ts-expect-error this works
// 	  // eslint-disable-next-line id-length
// 	  .reduce((sum, f) => sum - f/len * Math.log2(f/len), 0);
// }

// // Stub type definition containing just info i need
// type CertStreamData = {
// 	data: {
// 		leaf_cert: {
// 			all_domains: string[]
// 		}
// 	},
// 	message_type: "certificate_update" | "heartbeat"
// }

// const handleMessage = async (message: CertStreamData) => {
// 	if(message.message_type !== "certificate_update") return;

// 	// for(const domain of message.data.leaf_cert.all_domains) {
// 	// 	const digested = ctph.digest(domain);

// 	// 	for(const hashed of hashedDomains) {
// 	// 		if(ctph.similarity(hashed, digested) > threshold) {
// 	// 			await Redis.sadd("sentry_domains", domain);
// 	// 		} 
// 	// 	}
// 	// }

// 	const keywords: { score: number, word: string }[] = [{ word: 'login', score: 40 }, { word: 'log-in', score: 40 }, { word: 'signin', score: 40 }, { word: 'sign-in', score: 40 }, { word: 'account', score: 40 }, { word: 'verification', score: 40 }, { word: 'verify', score: 40 }, { word: 'password', score: 40 }, { word: 'support', score: 40 }, { word: 'security', score: 40 }, { word: 'authentication', score: 40 }, { word: 'wallet', score: 40 }, { word: 'alert', score: 40 }, { word: 'recover', score: 40 }, { word: 'unlock', score: 40 }, { word: 'apple', score: 30 }, { word: 'appleid', score: 60 }, { word: 'icloud', score: 60 }, { word: 'microsoft', score: 60 }, { word: 'office365', score: 60 }, { word: 'gmail', score: 60 }, { word: 'paypal', score: 60 }, { word: 'amazon', score: 60 }];
// 	const tlds: string[] = ["ga", "gq", "ml", "cf", "tk", "xyz", "cc", "pw", "club", "work", "top", "support", "bank", "info", "loan", "download", "online", "win", "review", "vip", "tech"];

// 	for(let domain of message.data.leaf_cert.all_domains) {
// 		const original = domain;

// 		let score = 0;

// 		for(const tld of tlds) {
// 			if(domain.endsWith(tld)) {
// 				score += 30;
// 				break;
// 			}
// 		}

// 		domain = domain.replaceAll("*.", "");
// 		score += Math.round(shannonEntropy(domain) * 10);

// 		const wordsInDomain = domain.split(/W+/);
// 		if(["com", "net", "org"].includes(wordsInDomain[0] ?? ""))
// 		for(const word of wordsInDomain) {
// 			for(const keyword of keywords) {
// 				if(keyword.word === word) score += keyword.score;
// 				else if(ctph.similarity(ctph.digest(word), ctph.digest(keyword.word)) > 85) score += 70;
// 			}
// 		}

// 		score += domain.split('').filter((char) => ["-", "."].includes(char)).length * 5;

// 		if(score > 75) {
// 			await Redis.sadd("sentry_domains", original);
// 		}
// 	}
// };

export function initCT() { 
	// new CertStreamClient(handleMessage).connect();
}