import { generateKey } from "@47ng/cloak";
import { io } from "@interval/sdk";
import { config } from "../config.js";
import type { Action } from "../types.js";

let configured: string;

export default {
  name: "GenerateEncryptionKeys",
  execute: async () => {
    if (!(await io.confirmIdentity("This is a sensitive action!"))) return;

    if (config.sentry.ENCRYPTION_KEY.length > 0 || configured)
      throw new Error(
        `Encryption keys are already configured, find them at your config.toml file, and ensure a secure backup is kept: \n\nYour Key is: ${
          config.sentry.ENCRYPTION_KEY.length === 0
            ? configured
            : config.sentry.ENCRYPTION_KEY
        }`
      );

    const key = generateKey();
    configured = key;

    return `Your encryption key is ${key}\n\nAdd it to your config.toml under the ENCRYPTION_KEY setting.`;
  },
} as Action;
