import {
  blue,
  bold,
  cyan,
  gray,
  green,
  italic,
  magenta,
  red,
  white,
  yellow,
} from "https://deno.land/std@0.141.0/fmt/colors.ts";
import { DEVELOPMENT } from "@config";
import { printf } from "https://deno.land/std@0.141.0/fmt/printf.ts";

interface ILogOptions {
  level: LogLevel;
  prefix?: string;
}

export function log(
  opts: ILogOptions,
  messages: string | Record<string | number | symbol, unknown>,
) {
  if (opts.level == LogLevel.Debug && !DEVELOPMENT) return;

  let toLog = italic(
    gray(
      `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} `,
    ),
  ) + cyan(opts.prefix ? opts.prefix + " " : "");

  switch (opts.level) {
    case LogLevel.Debug: {
      toLog += bold(green("DEBUG"));
      break;
    }
    case LogLevel.Info: {
      toLog += bold(blue("INFO"));
      break;
    }
    case LogLevel.Sucess: {
      toLog += bold(green("SUCCESS"));
      break;
    }
    case LogLevel.Warn: {
      toLog += bold(yellow("WARN"));
      break;
    }
    case LogLevel.Error: {
      toLog += bold(red("ERROR"));
      break;
    }
    case LogLevel.Fatal: {
      toLog += bold(magenta("FATAL"));
      break;
    }
    case LogLevel.Silly: {
      toLog += bold(white("SILLY"));
      break;
    }
  }

  if (typeof messages == "object") {
    messages = Deno.inspect(messages);
  }

  printf(toLog + ` ${messages}\n`);
}

export enum LogLevel {
  Debug,
  Info,
  Sucess,
  Warn,
  Error,
  Fatal,
  Silly,
}
