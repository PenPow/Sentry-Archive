import type { IntervalActionDefinition } from "@interval/sdk";

/**
 * Script to be ran on {@link https://interval.com/}
 * 
 * @public
 */
export type Action = {
  execute: IntervalActionDefinition;
  name: string;
};
