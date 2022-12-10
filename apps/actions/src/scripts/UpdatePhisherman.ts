import { io, ctx } from "@interval/sdk";
import { config } from "../config.js";
import type { Action } from "../types.js";

export default {
  name: "UpdatePhisherman",
  execute: async () => {
	await io.confirm("Are you sure?");

	await ctx.loading.start({ title: 'Loading Domains from Sources', description: 'This should take ~15 seconds' });

	await fetch("http://phishertools:3001/reload", { headers: { token: config.discord.TOKEN } });
  },
} as Action;
