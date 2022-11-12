import { Interval, IntervalActionDefinition } from "@interval/sdk";
import { config } from "./utils.js";
import glob from "glob";

export interface Action {
	name: string,
	execute: IntervalActionDefinition
}

const scripts: string[] = await new Promise(((resolve) => { 
	glob(`src/scripts/**/*`, (_err, files) => resolve(files));
}))

const actions: Record<string, IntervalActionDefinition> = {}

for(const action of scripts) {
	const exports: Action = (await import(`./${action.replace('.ts', '.js').replace('src/', '')}`)).default

	actions[exports.name] = exports.execute
}

const interval = new Interval({
	apiKey: process.env.NODE_ENV === 'production' ? config.interval.PRODUCTION_API_KEY : config.interval.DEV_API_KEY,
	logLevel: 'prod',
	actions
  });
  
interval.listen();