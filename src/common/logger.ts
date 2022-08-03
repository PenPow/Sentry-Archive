import { inspect } from 'node:util';
import chalk from 'chalk';
import { DEVELOPMENT } from "./config.js";

export enum LogLevel {
	Debug,
	Info,
	Success,
	Warn,
	Error,
	Fatal,
	Silly,
}

interface ILogOptions {
	level: LogLevel;
	prefix: string;
}

export function log(opts: ILogOptions, messages: string | number | Record<string | number | symbol, unknown> | Error) {
	if (opts.level === LogLevel.Debug && !DEVELOPMENT) return;

	let toLog = chalk.italic(
		chalk.gray(
			`${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} `,
		),
	) + chalk.cyan(opts.prefix.length > 15 ? `${opts.prefix.substring(0, 15)}...` : opts.prefix);

	toLog += ' '.repeat(16 - opts.prefix.length <= 0 ? 1 : 16 - opts.prefix.length + 3);

	switch (opts.level) {
		case LogLevel.Debug: {
			toLog += `${chalk.bold(chalk.cyan('DEBUG'))}  `;
			break;
		}
		case LogLevel.Info: {
			toLog += `${chalk.bold(chalk.blue('INFO'))}   `;
			break;
		}
		case LogLevel.Success: {
			toLog += chalk.bold(chalk.green('SUCCESS'));
			break;
		}
		case LogLevel.Warn: {
			toLog += `${chalk.bold(chalk.yellow('WARN'))}   `;
			break;
		}
		case LogLevel.Error: {
			toLog += `${chalk.bold(chalk.red('ERROR'))}  `;
			break;
		}
		case LogLevel.Fatal: {
			toLog += `${chalk.bold(chalk.magenta('FATAL'))}  `;
			break;
		}
		case LogLevel.Silly: {
			toLog += `${chalk.bold(chalk.white('SILLY'))}  `;
			break;
		}
	}

	if (messages instanceof Error) {
		console.log(`${toLog} ${inspect(messages, { depth: 100, getters: true, colors: true }).replaceAll("'", "")}`);

		return;
	}

	console.log(`${toLog} ${(typeof messages === "string" || typeof messages === "number" ? messages : inspect(messages, { depth: 100, getters: true, colors: false }).replaceAll("'", "")).toString().replaceAll("\n", `\n${" ".repeat(toLog.length - 47)}`)} `);
}
