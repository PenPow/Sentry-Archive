import { BlockListProject } from "./lists/BlockListProject.js";
import { Dogino } from "./lists/Dogino.js";
import { Elkbr } from "./lists/Elkbr.js";
import { HyperPhish } from "./lists/HyperPhish.js";
import { Jagrosh } from "./lists/Jagrosh.js";
import { PhishTank } from "./lists/PhishTank.js";
import { PiholeBlocklist } from "./lists/PiholeBlocklist.js";
import { Sentry } from "./lists/Sentry.js";
import { SinkingYachts } from "./lists/SinkingYachts.js";
import { URLhaus } from "./lists/URLhaus.js";
import { WalshyDev } from "./lists/WalshyDev.js";
import { ZeroTwo } from "./lists/ZeroTwo.js";
import { malvertising } from "./lists/malvertising.js";

/**
 * Type to represent a data source to be consumed
 * 
 * @public
 */
export type Source = {
	/**
	 * Function to generate the domain list
	 * 
	 * @public
	 * @returns A promise of array of domains (www.google.com rather than https://www.google.com) that should be registered
	 */
	fetch(): Promise<string[]>,
	/**
	 * The name of the data source
	 * 
	 * @public
	 */
	name: string
}

export const Sources: Source[] = [BlockListProject, Dogino, Elkbr, HyperPhish, Jagrosh, PhishTank, PiholeBlocklist, Sentry, SinkingYachts, URLhaus, WalshyDev, ZeroTwo, malvertising];