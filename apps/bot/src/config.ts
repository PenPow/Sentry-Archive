import { readFile } from "node:fs/promises";
import type { Config } from "shared";
import { parse } from "toml";
import { Logger } from "tslog";

export const config: Config = parse(await readFile("config.toml", "utf8"));

export const logger = new Logger();
