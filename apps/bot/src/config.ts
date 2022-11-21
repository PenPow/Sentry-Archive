import { readFile } from "node:fs/promises";
import { parse } from "toml";
import type { Config } from 'shared';
import { Logger } from "tslog";

export const config: Config = parse(await readFile('config.toml', 'utf-8'));

export const logger = new Logger()