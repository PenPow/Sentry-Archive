import { inspect } from "util";
import { ApplicationCommandOptionType, ApplicationCommandType, codeBlock, EmbedBuilder } from "discord.js";
import { nanoid } from "nanoid";
import { get, create, SourceBin } from 'sourcebin';
import pkg from "typescript";
import { translate } from "../../../common/translations/translate.js";
import { InteractionManager, ResponseType } from "../../managers/InteractionManager.js";
import { FunctionType, IFunction, PermissionTier } from "../../structures/Interaction.js";
// import { log, LogLevel } from "../../../common/logger.js";

const { transpile, getParsedCommandLineOfConfigFile, sys, ModuleKind, ModuleResolutionKind, ScriptTarget } = pkg;

const EvalCommand: IFunction = {
	type: FunctionType.ChatInput,
	permissions: PermissionTier.Developer,
	async execute(interaction) {
		await InteractionManager.sendInteractionResponse(interaction, { ephemeral: true }, ResponseType.Defer);

		const bin = await get(interaction.options.getString(translate("en-GB", "EVAL_COMMAND_SOURCE_OPTION_NAME"), true).split('/').at(-1) ?? '0');

		let code = bin.files[0].content.replaceAll(/[“”]/gim, '"');

		if (code.includes('return')) code = `(() => { \n${code} })()`;
		if (code.includes('await')) code = `(async () => { \n${bin.files[0].content.replaceAll(/[“”]/gim, '"')} })()`;

		code = code.replaceAll('client', "interaction.client");

		const embed = new EmbedBuilder();

		if (bin.files[0].languageId === 183) {
			try {
				// eslint-disable-next-line no-eval, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
				const evaled = await eval(code);
				const inspected = inspect(evaled, { depth: 5, maxArrayLength: 5, getters: true });

				let extendedURL: SourceBin | null = null;

				if (inspected.length > 1015) extendedURL = await create([{ content: inspected, language: 'js' }], { title: `Output Log (${nanoid()})` }).catch();

				embed
					.setTimestamp()
					.setColor(0x5C6CFF)
					.setFooter({ text: 'Sentry' })
					.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: interaction.user.tag })
					// eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-member-access
					.setDescription([`**Time Taken**: ${(Date.now() - interaction.createdTimestamp).toLocaleString()}ms`, `**Output Type**: ${evaled?.constructor.name === "Array" ? `${evaled.constructor.name}<${evaled[0]?.constructor.name}>` : evaled?.constructor.name ?? typeof evaled}`, `**Output Length**: ${inspected.length} characters`].join('\n'))
					.addFields(...[{ name: 'Input', value: codeBlock('js', code.substring(0, 1015)) }, { name: 'Output', value: extendedURL ? `${extendedURL.url}\n${codeBlock("js", inspected.substring(0, 984))}` : codeBlock("js", inspected.substring(0, 1015)) }]);
			} catch (e) {
				// log({ level: LogLevel.Error, prefix: 'Eval Command' }, inspect(e, { depth: 100, colors: true }));

				let extendedURL: SourceBin | null = null;

				if (((e as Error).stack?.length ?? 0) > 1015) extendedURL = await create([{ content: (e as Error).stack ?? 'An Error Occured Making this Error', language: 'js' }], { title: `Error Log (${nanoid()})` }).catch();

				embed
					.setTimestamp()
					.setColor(0x5C6CFF)
					.setFooter({ text: 'Sentry' })
					.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: interaction.user.tag })
					// eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-member-access
					.setDescription([`**Time Taken**: ${(Date.now() - interaction.createdTimestamp).toLocaleString()}ms`, `**Output Type**: ${(e as Error).name}`, `**Output Length**: ${(e as Error).stack?.length}`].join('\n'))
					.addFields(...[{ name: 'Input', value: codeBlock('ts', code.substring(0, 1015)) }, { name: 'Error', value: extendedURL ? `${extendedURL.url}\n${codeBlock("js", (e as Error).stack?.substring(0, 984) ?? (e as Error).message)}` : codeBlock("js", (e as Error).stack?.substring(0, 1015) ?? (e as Error).message) }]);
			}
		} else if (bin.files[0].languageId === 378) {
			const options = getParsedCommandLineOfConfigFile(
				"tsconfig.json",
				{},
				{
					...sys,
					onUnRecoverableConfigFileDiagnostic: console.error,
				}
			)?.options;

			if (!options) return void await InteractionManager.sendInteractionResponse(interaction, { content: "Couldn't Parse TSConfig" }, ResponseType.FollowUp);

			options.sourceMap = false;
			options.alwaysStrict = false;
			options.module = ModuleKind.Node16;
			options.moduleResolution = ModuleResolutionKind.NodeNext;
			options.target = ScriptTarget.ES2022;

			const transpiled = transpile(code, options).replace('Object.defineProperty(exports, "__esModule", { value: true });', '');

			try {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, no-eval
				const evaled = await eval(transpiled);
				const inspected = inspect(evaled, { depth: 5, maxArrayLength: 5, getters: true });

				let extendedURL: SourceBin | null = null;

				if (inspected.length > 1015) extendedURL = await create([{ content: inspected, language: 'js' }], { title: `Output Log (${nanoid()})` }).catch();

				embed
					.setTimestamp()
					.setColor(0x5C6CFF)
					.setFooter({ text: 'Sentry' })
					.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: interaction.user.tag })
					// eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-member-access
					.setDescription([`**Time Taken**: ${(Date.now() - interaction.createdTimestamp).toLocaleString()}ms`, `**Output Type**: ${evaled?.constructor.name === "Array" ? `${evaled.constructor.name}<${evaled[0]?.constructor.name}>` : evaled?.constructor.name ?? typeof evaled}`, `**Output Length**: ${inspected.length} characters`].join('\n'))
					.addFields(...[{ name: 'Input', value: codeBlock('ts', code.substring(0, 1015)) }, { name: 'Transpiled', value: codeBlock('js', transpiled.substring(0, 1015)) }, { name: 'Output', value: extendedURL ? `${extendedURL.url}\n${codeBlock("js", inspected.substring(0, 984))}` : codeBlock("js", inspected.substring(0, 1015)) }]);
			} catch (e) {
				// log({ level: LogLevel.Error, prefix: 'Eval Command' }, inspect(e, { depth: 100, colors: true }));

				let extendedURL: SourceBin | null = null;

				if (((e as Error).stack?.length ?? 0) > 1015) extendedURL = await create([{ content: (e as Error).stack ?? 'An Error Occured Making this Error', language: 'js' }], { title: `Error Log (${nanoid()})` }).catch();

				embed
					.setTimestamp()
					.setColor(0x5C6CFF)
					.setFooter({ text: 'Sentry' })
					.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: interaction.user.tag })
					// eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-member-access
					.setDescription([`**Time Taken**: ${(Date.now() - interaction.createdTimestamp).toLocaleString()}ms`, `**Output Type**: ${(e as Error).name}`, `**Output Length**: ${(e as Error).stack?.length}`].join('\n'))
					.addFields(...[{ name: 'Input', value: codeBlock('ts', code.substring(0, 1015)) }, { name: 'Transpiled', value: codeBlock('js', transpiled.substring(0, 1015)) }, { name: 'Error', value: extendedURL ? `${extendedURL.url}\n${codeBlock("js", (e as Error).stack?.substring(0, 984) ?? (e as Error).message)}` : codeBlock("js", (e as Error).stack?.substring(0, 1015) ?? (e as Error).message) }]);
			}
		} else {
			embed
				.setTimestamp()
				.setColor(0xFF5C5C)
				.setTitle("Invalid Language")
				.setDescription("I don't support that language yet!")
				.setFooter({ text: 'Sentry', iconURL: interaction.client.user?.displayAvatarURL() ?? '' })
				.setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() });
		}

		return void await InteractionManager.sendInteractionResponse(interaction, { ephemeral: true, embeds: [embed] }, ResponseType.FollowUp);
	},
	toJSON() {
		return {
			name: "EVAL_COMMAND_NAME",
			description: "EVAL_COMMAND_DESCRIPTION",
			type: ApplicationCommandType.ChatInput,
			options: [{
				name: "EVAL_COMMAND_SOURCE_OPTION_NAME",
				description: "EVAL_COMMAND_SOURCE_OPTION_DESCRIPTION",
				type: ApplicationCommandOptionType.String,
				required: true
			}]
		};
	},
};

export default EvalCommand;
