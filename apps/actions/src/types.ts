import type { IntervalActionDefinition } from "@interval/sdk";

export type Action = {
  execute: IntervalActionDefinition;
  name: string;
};
