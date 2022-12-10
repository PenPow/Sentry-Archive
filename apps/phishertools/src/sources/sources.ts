import { BlockListProject } from "./lists/BlockListProject.js";
import { Elkbr } from "./lists/Elkbr.js";
import { HyperPhish } from "./lists/HyperPhish.js";
import { Jagrosh } from "./lists/Jagrosh.js";
import { PiholeBlocklist } from "./lists/PiholeBlocklist.js";
import { URLhaus } from "./lists/URLhaus.js";
import { WalshyDev } from "./lists/WalshyDev.js";
import { ZeroTwo } from "./lists/ZeroTwo.js";
import { malvertising } from "./lists/malvertising.js";

export type Source = {
	fetch(): Promise<string[]>,
	name: string
}

export const Sources: Source[] = [BlockListProject, Elkbr, HyperPhish, Jagrosh, PiholeBlocklist, URLhaus, WalshyDev, ZeroTwo, malvertising];