import { readdir } from "fs/promises";
import { join } from "path";
import { REST } from "@discordjs/rest";
import { Result } from "@sapphire/result";
import * as Sentry from "@sentry/node";
import { RESTPostAPIApplicationCommandsJSONBody, RESTPostAPIChatInputApplicationCommandsJSONBody, APIApplicationCommandOption, ApplicationCommandOptionType, APIApplicationCommandOptionChoice, APIApplicationCommandIntegerOption, APIApplicationCommandNumberOption, APIApplicationCommandStringOption, Routes, RESTPostAPIContextMenuApplicationCommandsJSONBody, InteractionReplyOptions, InteractionType, ApplicationCommandOptionChoiceData, ChatInputCommandInteraction, AutocompleteInteraction, InteractionDeferReplyOptions, EmbedBuilder, Interaction, ContextMenuCommandInteraction, SelectMenuInteraction, ButtonInteraction, ModalSubmitInteraction, InteractionResponse, Message, InteractionUpdateOptions } from "discord.js";
import { DEVELOPMENT, DEV_GUILD_ID } from "../../common/config.js";
import { log, LogLevel } from "../../common/logger.js";
import { translate } from "../../common/translations/translate.js";
import { ICommandFunction, IComponentFunction, IContextMenuFunction, IFunction, PermissionTier } from "../structures/Interaction.js";

export const store = {
	commands: new Map<string, ICommandFunction>(),
	components: new Map<string, IComponentFunction>(),
	contexts: new Map<string, IContextMenuFunction>(),
	loaded: false
};

export enum ResponseType {
	Reply,
	Defer,
	FollowUp,
	EditReply,
	Update
}

export const InteractionManager = {
	sendInteractionResponse: async function(interaction: ChatInputCommandInteraction | AutocompleteInteraction | ContextMenuCommandInteraction | SelectMenuInteraction | ButtonInteraction | ModalSubmitInteraction, data: InteractionReplyOptions | InteractionDeferReplyOptions | InteractionUpdateOptions | ApplicationCommandOptionChoiceData[], action?: ResponseType): Promise<Result<void | InteractionResponse | Message, Error>> {
		try {
			if (!interaction.isRepliable()) return Result.err(new Error("Cannot Reply to Interaction"));

			if (interaction.type === InteractionType.ApplicationCommandAutocomplete && Array.isArray(data)) {
				const d = await interaction.respond(data);
				return Result.ok(d);
			}

			if ([InteractionType.ApplicationCommand, InteractionType.MessageComponent, InteractionType.ModalSubmit].includes(interaction.type) && !Array.isArray(data)) {
				if (action === undefined) return Result.err(new Error("No Action Supplied"));

				// @ts-expect-error it works
				if (data.ephemeral === undefined) data.ephemeral = true;

				if (action === ResponseType.Reply) {
					if (interaction.replied || interaction.deferred) return Result.err(new Error("Already Replied"));

					const d = await interaction.reply(data as InteractionReplyOptions);

					return Result.ok(d);
				} else if (action === ResponseType.Defer) {
					if (interaction.replied || interaction.deferred) return Result.err(new Error("Already Deferred"));

					const d = await interaction.deferReply(data);

					return Result.ok(d);
				} else if (action === ResponseType.FollowUp) {
					if (!interaction.replied && !interaction.deferred) return Result.err(new Error("No Reply"));

					const d = await interaction.followUp(data as InteractionReplyOptions);

					return Result.ok(d);
				} else if (action === ResponseType.EditReply) {
					if (!interaction.replied && !interaction.deferred) return Result.err(new Error("No Reply"));

					const d = await interaction.editReply(data as InteractionReplyOptions);

					return Result.ok(d);
				// eslint-disable-next-line no-else-return
				} else {
					// @ts-expect-error it works
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
					const d = await interaction.update(data as InteractionUpdateOptions);

					return Result.ok(d);
				}
			}
		} catch (e) {
			Sentry.captureException(e);
			log({ level: LogLevel.Error, prefix: 'Interaction Response' }, `Failed to send response: ${(e as Error).message}`);
			return Result.err(e as Error);
		}

		return Result.err(new Error("something went wrong somewhere"));
	},
	loadInteractions: async function() {
		if (store.loaded) return;

		try {
			const folders = await readdir(join(process.cwd(), "dist", "bot", "interactions"));

			for (const folder of folders) {
				const files = await readdir(join(process.cwd(), "dist", "bot", "interactions", folder));

				for (const file of files) {
					if (['.disabled', '.d.ts', '.map'].some(suffix => file.endsWith(suffix))) continue;

					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
					const interaction: IFunction = (await import(join(process.cwd(), "dist", "bot", "interactions", folder, file))).default;

					if (folder === "commands") store.commands.set(translate("en-GB", (interaction as ICommandFunction).toJSON().name), interaction as ICommandFunction);
					else if (folder === "components") store.components.set((interaction as IComponentFunction).id, interaction as IComponentFunction);
					else if (folder === "contexts") store.contexts.set(translate("en-GB", (interaction as IContextMenuFunction).toJSON().name), interaction as IContextMenuFunction);
				}
			}

			log({ level: LogLevel.Info, prefix: 'Interaction Manager' }, `Loaded ${store.commands.size + store.components.size + store.contexts.size} Interactions`);
			store.loaded = true;
		} catch (e) {
			Sentry.captureException(e);
			log({ level: LogLevel.Warn, prefix: 'Interaction Manager' }, `Failed to Load Interactions? Are there any to load?\n${(e as Error).message}`);
		}
	},
	registerInteractions: async function(clientId: string) {
		log({ level: LogLevel.Warn, prefix: 'Interaction Manager' }, 'Registering Interactions! Disable this option next launch');

		const rest = new REST({ version: '10' }).setToken(process.env.DISCORD);

		const toRegister: RESTPostAPIApplicationCommandsJSONBody[] = [];

		for (const command of store.commands.values()) {
			const parsed = command.toJSON();

			if (!DEVELOPMENT && command.permissions === PermissionTier.Developer) continue;

			const transformed: RESTPostAPIChatInputApplicationCommandsJSONBody = {
				...parsed,
				name: translate("en-GB", parsed.name),
				description: translate("en-GB", parsed.description),
				name_localizations: {
					"da": translate("da", parsed.name),
					"de": translate("de", parsed.name),
					"en-GB": translate("en-GB", parsed.name),
					"en-US": translate("en-US", parsed.name),
					"es-ES": translate("es-ES", parsed.name),
					"fr": translate("fr", parsed.name),
					"hr": translate("hr", parsed.name),
					"it": translate("it", parsed.name),
					"lt": translate("lt", parsed.name),
					"hu": translate("hu", parsed.name),
					"nl": translate("nl", parsed.name),
					"no": translate("no", parsed.name),
					"pl": translate("pl", parsed.name),
					"pt-BR": translate("pt-BR", parsed.name),
					"ro": translate("ro", parsed.name),
					"fi": translate("fi", parsed.name),
					"sv-SE": translate("sv-SE", parsed.name),
					"vi": translate("vi", parsed.name),
					"tr": translate("tr", parsed.name),
					"cs": translate("cs", parsed.name),
					"el": translate("el", parsed.name),
					"bg": translate("bg", parsed.name),
					"ru": translate("ru", parsed.name),
					"uk": translate("uk", parsed.name),
					"hi": translate("hi", parsed.name),
					"th": translate("th", parsed.name),
					"zh-CN": translate("zh-CN", parsed.name),
					"ja": translate("ja", parsed.name),
					"zh-TW": translate("zh-TW", parsed.name),
					"ko": translate("ko", parsed.name),
				},
				description_localizations: {
					"da": translate("da", parsed.description),
					"de": translate("de", parsed.description),
					"en-GB": translate("en-GB", parsed.description),
					"en-US": translate("en-US", parsed.description),
					"es-ES": translate("es-ES", parsed.description),
					"fr": translate("fr", parsed.description),
					"hr": translate("hr", parsed.description),
					"it": translate("it", parsed.description),
					"lt": translate("lt", parsed.description),
					"hu": translate("hu", parsed.description),
					"nl": translate("nl", parsed.description),
					"no": translate("no", parsed.description),
					"pl": translate("pl", parsed.description),
					"pt-BR": translate("pt-BR", parsed.description),
					"ro": translate("ro", parsed.description),
					"fi": translate("fi", parsed.description),
					"sv-SE": translate("sv-SE", parsed.description),
					"vi": translate("vi", parsed.description),
					"tr": translate("tr", parsed.description),
					"cs": translate("cs", parsed.description),
					"el": translate("el", parsed.description),
					"bg": translate("bg", parsed.description),
					"ru": translate("ru", parsed.description),
					"uk": translate("uk", parsed.description),
					"hi": translate("hi", parsed.description),
					"th": translate("th", parsed.description),
					"zh-CN": translate("zh-CN", parsed.description),
					"ja": translate("ja", parsed.description),
					"zh-TW": translate("zh-TW", parsed.description),
					"ko": translate("ko", parsed.description),
				},
			};

			const transformedOptions: APIApplicationCommandOption[] = [];

			if (parsed.options) {
				for (const option of parsed.options) {
					const transformedOption: APIApplicationCommandOption = {
						...option,
						name: translate("en-GB", option.name),
						description: translate("en-GB", option.description),
						name_localizations: {
							"da": translate("da", option.name),
							"de": translate("de", option.name),
							"en-GB": translate("en-GB", option.name),
							"en-US": translate("en-US", option.name),
							"es-ES": translate("es-ES", option.name),
							"fr": translate("fr", option.name),
							"hr": translate("hr", option.name),
							"it": translate("it", option.name),
							"lt": translate("lt", option.name),
							"hu": translate("hu", option.name),
							"nl": translate("nl", option.name),
							"no": translate("no", option.name),
							"pl": translate("pl", option.name),
							"pt-BR": translate("pt-BR", option.name),
							"ro": translate("ro", option.name),
							"fi": translate("fi", option.name),
							"sv-SE": translate("sv-SE", option.name),
							"vi": translate("vi", option.name),
							"tr": translate("tr", option.name),
							"cs": translate("cs", option.name),
							"el": translate("el", option.name),
							"bg": translate("bg", option.name),
							"ru": translate("ru", option.name),
							"uk": translate("uk", option.name),
							"hi": translate("hi", option.name),
							"th": translate("th", option.name),
							"zh-CN": translate("zh-CN", option.name),
							"ja": translate("ja", option.name),
							"zh-TW": translate("zh-TW", option.name),
							"ko": translate("ko", option.name),
						},
						description_localizations: {
							"da": translate("da", option.description),
							"de": translate("de", option.description),
							"en-GB": translate("en-GB", option.description),
							"en-US": translate("en-US", option.description),
							"es-ES": translate("es-ES", option.description),
							"fr": translate("fr", option.description),
							"hr": translate("hr", option.description),
							"it": translate("it", option.description),
							"lt": translate("lt", option.description),
							"hu": translate("hu", option.description),
							"nl": translate("nl", option.description),
							"no": translate("no", option.description),
							"pl": translate("pl", option.description),
							"pt-BR": translate("pt-BR", option.description),
							"ro": translate("ro", option.description),
							"fi": translate("fi", option.description),
							"sv-SE": translate("sv-SE", option.description),
							"vi": translate("vi", option.description),
							"tr": translate("tr", option.description),
							"cs": translate("cs", option.description),
							"el": translate("el", option.description),
							"bg": translate("bg", option.description),
							"ru": translate("ru", option.description),
							"uk": translate("uk", option.description),
							"hi": translate("hi", option.description),
							"th": translate("th", option.description),
							"zh-CN": translate("zh-CN", option.description),
							"ja": translate("ja", option.description),
							"zh-TW": translate("zh-TW", option.description),
							"ko": translate("ko", option.description),
						},
					};

					if ([ApplicationCommandOptionType.String, ApplicationCommandOptionType.Number, ApplicationCommandOptionType.Integer].includes(option.type as ApplicationCommandOptionType) && option.choices) {
						const transformedChoices: APIApplicationCommandOptionChoice[] = [];

						for (const choice of option.choices) {
							transformedChoices.push({
								name: translate("en-GB", choice.name),
								name_localizations: {
									"da": translate("da", choice.name),
									"de": translate("de", choice.name),
									"en-GB": translate("en-GB", choice.name),
									"en-US": translate("en-US", choice.name),
									"es-ES": translate("es-ES", choice.name),
									"fr": translate("fr", choice.name),
									"hr": translate("hr", choice.name),
									"it": translate("it", choice.name),
									"lt": translate("lt", choice.name),
									"hu": translate("hu", choice.name),
									"nl": translate("nl", choice.name),
									"no": translate("no", choice.name),
									"pl": translate("pl", choice.name),
									"pt-BR": translate("pt-BR", choice.name),
									"ro": translate("ro", choice.name),
									"fi": translate("fi", choice.name),
									"sv-SE": translate("sv-SE", choice.name),
									"vi": translate("vi", choice.name),
									"tr": translate("tr", choice.name),
									"cs": translate("cs", choice.name),
									"el": translate("el", choice.name),
									"bg": translate("bg", choice.name),
									"ru": translate("ru", choice.name),
									"uk": translate("uk", choice.name),
									"hi": translate("hi", choice.name),
									"th": translate("th", choice.name),
									"zh-CN": translate("zh-CN", choice.name),
									"ja": translate("ja", choice.name),
									"zh-TW": translate("zh-TW", choice.name),
									"ko": translate("ko", choice.name),
								},
								value: choice.value
							});
						}

						// @ts-expect-error i give up troubleshooting these types
						(transformedOption as APIApplicationCommandStringOption | APIApplicationCommandNumberOption | APIApplicationCommandIntegerOption).choices = transformedChoices;
					}

					if ([ApplicationCommandOptionType.Subcommand, ApplicationCommandOptionType.SubcommandGroup].includes(option.type as ApplicationCommandOptionType) && option.options) {
						const transformedSubOptions: APIApplicationCommandOption[] = [];
						for (const opt of option.options) {
							const transformedSubOption: APIApplicationCommandOption = {
								...opt,
								name: translate("en-GB", opt.name),
								description: translate("en-GB", opt.description),
								name_localizations: {
									"da": translate("da", opt.name),
									"de": translate("de", opt.name),
									"en-GB": translate("en-GB", opt.name),
									"en-US": translate("en-US", opt.name),
									"es-ES": translate("es-ES", opt.name),
									"fr": translate("fr", opt.name),
									"hr": translate("hr", opt.name),
									"it": translate("it", opt.name),
									"lt": translate("lt", opt.name),
									"hu": translate("hu", opt.name),
									"nl": translate("nl", opt.name),
									"no": translate("no", opt.name),
									"pl": translate("pl", opt.name),
									"pt-BR": translate("pt-BR", opt.name),
									"ro": translate("ro", opt.name),
									"fi": translate("fi", opt.name),
									"sv-SE": translate("sv-SE", opt.name),
									"vi": translate("vi", opt.name),
									"tr": translate("tr", opt.name),
									"cs": translate("cs", opt.name),
									"el": translate("el", opt.name),
									"bg": translate("bg", opt.name),
									"ru": translate("ru", opt.name),
									"uk": translate("uk", opt.name),
									"hi": translate("hi", opt.name),
									"th": translate("th", opt.name),
									"zh-CN": translate("zh-CN", opt.name),
									"ja": translate("ja", opt.name),
									"zh-TW": translate("zh-TW", opt.name),
									"ko": translate("ko", opt.name),
								},
								description_localizations: {
									"da": translate("da", opt.description),
									"de": translate("de", opt.description),
									"en-GB": translate("en-GB", opt.description),
									"en-US": translate("en-US", opt.description),
									"es-ES": translate("es-ES", opt.description),
									"fr": translate("fr", opt.description),
									"hr": translate("hr", opt.description),
									"it": translate("it", opt.description),
									"lt": translate("lt", opt.description),
									"hu": translate("hu", opt.description),
									"nl": translate("nl", opt.description),
									"no": translate("no", opt.description),
									"pl": translate("pl", opt.description),
									"pt-BR": translate("pt-BR", opt.description),
									"ro": translate("ro", opt.description),
									"fi": translate("fi", opt.description),
									"sv-SE": translate("sv-SE", opt.description),
									"vi": translate("vi", opt.description),
									"tr": translate("tr", opt.description),
									"cs": translate("cs", opt.description),
									"el": translate("el", opt.description),
									"bg": translate("bg", opt.description),
									"ru": translate("ru", opt.description),
									"uk": translate("uk", opt.description),
									"hi": translate("hi", opt.description),
									"th": translate("th", opt.description),
									"zh-CN": translate("zh-CN", opt.description),
									"ja": translate("ja", opt.description),
									"zh-TW": translate("zh-TW", opt.description),
									"ko": translate("ko", opt.description),
								},
							};

							if ([ApplicationCommandOptionType.String, ApplicationCommandOptionType.Number, ApplicationCommandOptionType.Integer].includes(opt.type as ApplicationCommandOptionType.String | ApplicationCommandOptionType.Number | ApplicationCommandOptionType.Integer) && opt.choices) {
								const subTransformedChoices: APIApplicationCommandOptionChoice[] = [];

								// @ts-expect-error its not undefined bruv i checked it 2 lines above
								for (const choi of option.choices) {
									subTransformedChoices.push({
										name: translate("en-GB", choi.name),
										name_localizations: {
											"da": translate("da", choi.name),
											"de": translate("de", choi.name),
											"en-GB": translate("en-GB", choi.name),
											"en-US": translate("en-US", choi.name),
											"es-ES": translate("es-ES", choi.name),
											"fr": translate("fr", choi.name),
											"hr": translate("hr", choi.name),
											"it": translate("it", choi.name),
											"lt": translate("lt", choi.name),
											"hu": translate("hu", choi.name),
											"nl": translate("nl", choi.name),
											"no": translate("no", choi.name),
											"pl": translate("pl", choi.name),
											"pt-BR": translate("pt-BR", choi.name),
											"ro": translate("ro", choi.name),
											"fi": translate("fi", choi.name),
											"sv-SE": translate("sv-SE", choi.name),
											"vi": translate("vi", choi.name),
											"tr": translate("tr", choi.name),
											"cs": translate("cs", choi.name),
											"el": translate("el", choi.name),
											"bg": translate("bg", choi.name),
											"ru": translate("ru", choi.name),
											"uk": translate("uk", choi.name),
											"hi": translate("hi", choi.name),
											"th": translate("th", choi.name),
											"zh-CN": translate("zh-CN", choi.name),
											"ja": translate("ja", choi.name),
											"zh-TW": translate("zh-TW", choi.name),
											"ko": translate("ko", choi.name),
										},
										value: choi.value
									});
								}
							}

							transformedSubOptions.push(transformedSubOption);
						}

						// @ts-expect-error its a sub command
						transformedOption.options = transformedSubOptions;
					}

					transformedOptions.push(transformedOption);
				}

				transformed.options = transformedOptions;
			}

			toRegister.push(transformed);
		}

		for (const context of store.contexts.values()) {
			const parsed = context.toJSON();
			const transformed: RESTPostAPIContextMenuApplicationCommandsJSONBody = {
				...parsed,
				name: translate("en-GB", parsed.name),
				name_localizations: {
					"da": translate("da", parsed.name),
					"de": translate("de", parsed.name),
					"en-GB": translate("en-GB", parsed.name),
					"en-US": translate("en-US", parsed.name),
					"es-ES": translate("es-ES", parsed.name),
					"fr": translate("fr", parsed.name),
					"hr": translate("hr", parsed.name),
					"it": translate("it", parsed.name),
					"lt": translate("lt", parsed.name),
					"hu": translate("hu", parsed.name),
					"nl": translate("nl", parsed.name),
					"no": translate("no", parsed.name),
					"pl": translate("pl", parsed.name),
					"pt-BR": translate("pt-BR", parsed.name),
					"ro": translate("ro", parsed.name),
					"fi": translate("fi", parsed.name),
					"sv-SE": translate("sv-SE", parsed.name),
					"vi": translate("vi", parsed.name),
					"tr": translate("tr", parsed.name),
					"cs": translate("cs", parsed.name),
					"el": translate("el", parsed.name),
					"bg": translate("bg", parsed.name),
					"ru": translate("ru", parsed.name),
					"uk": translate("uk", parsed.name),
					"hi": translate("hi", parsed.name),
					"th": translate("th", parsed.name),
					"zh-CN": translate("zh-CN", parsed.name),
					"ja": translate("ja", parsed.name),
					"zh-TW": translate("zh-TW", parsed.name),
					"ko": translate("ko", parsed.name),
				},
			};

			toRegister.push(transformed);
		}

		if (toRegister.length === 0) {
			log({ level: LogLevel.Warn, prefix: 'Interaction Manager' }, "Found No Commands to Send to Discord");
			return;
		}

		try {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			await rest.put(DEVELOPMENT ? Routes.applicationGuildCommands(clientId, DEV_GUILD_ID) : Routes.applicationCommands(clientId), { body: toRegister });
			log({ level: LogLevel.Success, prefix: 'REST Instance' }, `🚀 ${toRegister.length} Commands Shipped to Discord`);
		} catch (e) {
			Sentry.captureException(e);
			log({ level: LogLevel.Error, prefix: 'REST Instance' }, `🔥 Failed to send commands: ${(e as Error).message}`);
		}
	}
};

export function generateNoPermissionsEmbed(interaction: Interaction, userPerms: PermissionTier, needed: PermissionTier): EmbedBuilder {
	return new EmbedBuilder()
		.setTimestamp()
		.setColor(0xFF5C5C)
		.setTitle("Invalid Permissions")
		.setDescription(['You cannot use this command', '', `**Your Permission Level**: ${PermissionTier[userPerms]}`, `**You Require**: ${PermissionTier[needed]}`].join('\n'))
		.setFooter({ text: 'Sentry', iconURL: interaction.client.user?.displayAvatarURL() ?? '' })
		.setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() });
}
