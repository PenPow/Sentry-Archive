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
	prefix?: string;
}

export function log(
	opts: ILogOptions,
	messages: string | Record<string | number | symbol, unknown>,
) {
	if (opts.level === LogLevel.Debug && !DEVELOPMENT) return;

	let toLog = chalk.italic(
		chalk.gray(
			`${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} `,
		),
	) + chalk.cyan(opts.prefix ? `${opts.prefix} ` : '');

	switch (opts.level) {
		case LogLevel.Debug: {
			toLog += chalk.bold(chalk.green('DEBUG'));
			break;
		}
		case LogLevel.Info: {
			toLog += chalk.bold(chalk.blue('INFO'));
			break;
		}
		case LogLevel.Success: {
			toLog += chalk.bold(chalk.green('SUCCESS'));
			break;
		}
		case LogLevel.Warn: {
			toLog += chalk.bold(chalk.yellow('WARN'));
			break;
		}
		case LogLevel.Error: {
			toLog += chalk.bold(chalk.red('ERROR'));
			break;
		}
		case LogLevel.Fatal: {
			toLog += chalk.bold(chalk.magenta('FATAL'));
			break;
		}
		case LogLevel.Silly: {
			toLog += chalk.bold(chalk.white('SILLY'));
			break;
		}
	}

	if (typeof messages == 'object') {
		messages = inspect(messages);
	}

	console.log(`${toLog} ${messages}`);
}
