import type { Source } from "../sources.js";

// Dataset Source: https://github.com/jagrosh/Vortex
export const Jagrosh: Source = {
	name: 'Jagrosh',
	fetch: async () => {
		const url = "https://raw.githubusercontent.com/D09r/malvertising/master/scam-domains.csv";
		const res = await fetch(url);
		return (await res.text()).split('\n').filter((val) => !val.startsWith("//"));
	}
};