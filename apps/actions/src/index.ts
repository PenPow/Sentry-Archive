import process from "node:process";
import { Interval, type IntervalActionDefinition } from "@interval/sdk";
import glob from "glob";
import { config } from "./config.js";
import type { Action } from "./types.js";

const scripts: string[] = await new Promise((resolve) => {
    glob(`dist/scripts/**/*`, (_err, files) => resolve(files));
});

const actions: Record<string, IntervalActionDefinition> = {};

for (const action of scripts) {
    if (!action.endsWith(".js")) continue;

    const exports: Action = (await import(`./${action.replace("dist", "")}`))
      .default;

    actions[exports.name] = exports.execute;
 }

const interval = new Interval({
    apiKey:
      process.env.NODE_ENV === "production"
        ? config.interval.PRODUCTION_API_KEY
        : config.interval.DEV_API_KEY,
    actions,
});

await interval.listen();