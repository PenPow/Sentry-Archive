import { Command } from "../../types/command.ts";
import deploy from "./commands/dev/deploy.ts";
import execute from "./commands/dev/execute.ts";

export const commands: Record<string, Command> = {
  deploy,
  execute,
};
export default commands;
