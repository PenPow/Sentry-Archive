import { readdir } from "fs/promises";
import { join } from "path";
import { REST } from "@discordjs/rest";
import { Result } from "@sapphire/result";
import * as Sentry from "@sentry/node";
import { RESTPostAPIApplicationCommandsJSONBody, RESTPostAPIChatInputApplicationCommandsJSONBody, APIApplicationCommandOption, ApplicationCommandOptionType, APIApplicationCommandOptionChoice, APIApplicationCommandIntegerOption, APIApplicationCommandNumberOption, APIApplicationCommandStringOption, Routes, RESTPostAPIContextMenuApplicationCommandsJSONBody, InteractionReplyOptions, InteractionType, ApplicationCommandOptionChoiceData, ChatInputCommandInteraction, AutocompleteInteraction, InteractionDeferReplyOptions, EmbedBuilder, Interaction, ContextMenuCommandInteraction, SelectMenuInteraction, ButtonInteraction, ModalSubmitInteraction, InteractionResponse, Message, InteractionUpdateOptions, Locale } from "discord.js";
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

					if (folder === "commands") store.commands.set(translate(Locale.EnglishGB, (interaction as ICommandFunction).toJSON().name), interaction as ICommandFunction);
					else if (folder === "components") store.components.set((interaction as IComponentFunction).id, interaction as IComponentFunction);
					else if (folder === "contexts") store.contexts.set(translate(Locale.EnglishGB, (interaction as IContextMenuFunction).toJSON().name), interaction as IContextMenuFunction);
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
				name: translate(Locale.EnglishGB, parsed.name),
				description: translate(Locale.EnglishGB, parsed.description),
				name_localizations: {
					"da": translate(Locale.Danish, parsed.name),
					"de": translate(Locale.German, parsed.name),
					"en-GB": translate(Locale.EnglishGB, parsed.name),
					"en-US": translate(Locale.EnglishUS, parsed.name),
					"es-ES": translate(Locale.SpanishES, parsed.name),
					"fr": translate(Locale.French, parsed.name),
					"hr": translate(Locale.Hungarian, parsed.name),
					"it": translate(Locale.Italian, parsed.name),
					"lt": translate(Locale.Lithuanian, parsed.name),
					"hu": translate(Locale.Hungarian, parsed.name),
					"nl": translate(Locale.Dutch, parsed.name),
					"no": translate(Locale.Norwegian, parsed.name),
					"pl": translate(Locale.Polish, parsed.name),
					"pt-BR": translate(Locale.PortugueseBR, parsed.name),
					"ro": translate(Locale.Romanian, parsed.name),
					"fi": translate(Locale.Finnish, parsed.name),
					"sv-SE": translate(Locale.Swedish, parsed.name),
					"vi": translate(Locale.Vietnamese, parsed.name),
					"tr": translate(Locale.Turkish, parsed.name),
					"cs": translate(Locale.Czech, parsed.name),
					"el": translate(Locale.Greek, parsed.name),
					"bg": translate(Locale.Bulgarian, parsed.name),
					"ru": translate(Locale.Russian, parsed.name),
					"uk": translate(Locale.Ukrainian, parsed.name),
					"hi": translate(Locale.Hindi, parsed.name),
					"th": translate(Locale.Thai, parsed.name),
					"zh-CN": translate(Locale.ChineseCN, parsed.name),
					"ja": translate(Locale.Japanese, parsed.name),
					"zh-TW": translate(Locale.ChineseTW, parsed.name),
					"ko": translate(Locale.Korean, parsed.name),
				},
				description_localizations: {
					"da": translate(Locale.Danish, parsed.description),
					"de": translate(Locale.German, parsed.description),
					"en-GB": translate(Locale.EnglishGB, parsed.description),
					"en-US": translate(Locale.EnglishUS, parsed.description),
					"es-ES": translate(Locale.SpanishES, parsed.description),
					"fr": translate(Locale.French, parsed.description),
					"hr": translate(Locale.Hungarian, parsed.description),
					"it": translate(Locale.Italian, parsed.description),
					"lt": translate(Locale.Lithuanian, parsed.description),
					"hu": translate(Locale.Hungarian, parsed.description),
					"nl": translate(Locale.Dutch, parsed.description),
					"no": translate(Locale.Norwegian, parsed.description),
					"pl": translate(Locale.Polish, parsed.description),
					"pt-BR": translate(Locale.PortugueseBR, parsed.description),
					"ro": translate(Locale.Romanian, parsed.description),
					"fi": translate(Locale.Finnish, parsed.description),
					"sv-SE": translate(Locale.Swedish, parsed.description),
					"vi": translate(Locale.Vietnamese, parsed.description),
					"tr": translate(Locale.Turkish, parsed.description),
					"cs": translate(Locale.Czech, parsed.description),
					"el": translate(Locale.Greek, parsed.description),
					"bg": translate(Locale.Bulgarian, parsed.description),
					"ru": translate(Locale.Russian, parsed.description),
					"uk": translate(Locale.Ukrainian, parsed.description),
					"hi": translate(Locale.Hindi, parsed.description),
					"th": translate(Locale.Thai, parsed.description),
					"zh-CN": translate(Locale.ChineseCN, parsed.description),
					"ja": translate(Locale.Japanese, parsed.description),
					"zh-TW": translate(Locale.ChineseTW, parsed.description),
					"ko": translate(Locale.Korean, parsed.description),
				},
			};

			const transformedOptions: APIApplicationCommandOption[] = [];

			if (parsed.options) {
				for (const option of parsed.options) {
					const transformedOption: APIApplicationCommandOption = {
						...option,
						name: translate(Locale.EnglishGB, option.name),
						description: translate(Locale.EnglishGB, option.description),
						name_localizations: {
							"da": translate(Locale.Danish, option.name),
							"de": translate(Locale.German, option.name),
							"en-GB": translate(Locale.EnglishGB, option.name),
							"en-US": translate(Locale.EnglishUS, option.name),
							"es-ES": translate(Locale.SpanishES, option.name),
							"fr": translate(Locale.French, option.name),
							"hr": translate(Locale.Hungarian, option.name),
							"it": translate(Locale.Italian, option.name),
							"lt": translate(Locale.Lithuanian, option.name),
							"hu": translate(Locale.Hungarian, option.name),
							"nl": translate(Locale.Dutch, option.name),
							"no": translate(Locale.Norwegian, option.name),
							"pl": translate(Locale.Polish, option.name),
							"pt-BR": translate(Locale.PortugueseBR, option.name),
							"ro": translate(Locale.Romanian, option.name),
							"fi": translate(Locale.Finnish, option.name),
							"sv-SE": translate(Locale.Swedish, option.name),
							"vi": translate(Locale.Vietnamese, option.name),
							"tr": translate(Locale.Turkish, option.name),
							"cs": translate(Locale.Czech, option.name),
							"el": translate(Locale.Greek, option.name),
							"bg": translate(Locale.Bulgarian, option.name),
							"ru": translate(Locale.Russian, option.name),
							"uk": translate(Locale.Ukrainian, option.name),
							"hi": translate(Locale.Hindi, option.name),
							"th": translate(Locale.Thai, option.name),
							"zh-CN": translate(Locale.ChineseCN, option.name),
							"ja": translate(Locale.Japanese, option.name),
							"zh-TW": translate(Locale.ChineseTW, option.name),
							"ko": translate(Locale.Korean, option.name),
						},
						description_localizations: {
							"da": translate(Locale.Danish, option.description),
							"de": translate(Locale.German, option.description),
							"en-GB": translate(Locale.EnglishGB, option.description),
							"en-US": translate(Locale.EnglishUS, option.description),
							"es-ES": translate(Locale.SpanishES, option.description),
							"fr": translate(Locale.French, option.description),
							"hr": translate(Locale.Hungarian, option.description),
							"it": translate(Locale.Italian, option.description),
							"lt": translate(Locale.Lithuanian, option.description),
							"hu": translate(Locale.Hungarian, option.description),
							"nl": translate(Locale.Dutch, option.description),
							"no": translate(Locale.Norwegian, option.description),
							"pl": translate(Locale.Polish, option.description),
							"pt-BR": translate(Locale.PortugueseBR, option.description),
							"ro": translate(Locale.Romanian, option.description),
							"fi": translate(Locale.Finnish, option.description),
							"sv-SE": translate(Locale.Swedish, option.description),
							"vi": translate(Locale.Vietnamese, option.description),
							"tr": translate(Locale.Turkish, option.description),
							"cs": translate(Locale.Czech, option.description),
							"el": translate(Locale.Greek, option.description),
							"bg": translate(Locale.Bulgarian, option.description),
							"ru": translate(Locale.Russian, option.description),
							"uk": translate(Locale.Ukrainian, option.description),
							"hi": translate(Locale.Hindi, option.description),
							"th": translate(Locale.Thai, option.description),
							"zh-CN": translate(Locale.ChineseCN, option.description),
							"ja": translate(Locale.Japanese, option.description),
							"zh-TW": translate(Locale.ChineseTW, option.description),
							"ko": translate(Locale.Korean, option.description),
						},
					};

					if ([ApplicationCommandOptionType.String, ApplicationCommandOptionType.Number, ApplicationCommandOptionType.Integer].includes(option.type as ApplicationCommandOptionType) && option.choices) {
						const transformedChoices: APIApplicationCommandOptionChoice[] = [];

						for (const choice of option.choices) {
							transformedChoices.push({
								name: translate(Locale.EnglishGB, choice.name),
								name_localizations: {
									"da": translate(Locale.Danish, choice.name),
									"de": translate(Locale.German, choice.name),
									"en-GB": translate(Locale.EnglishGB, choice.name),
									"en-US": translate(Locale.EnglishUS, choice.name),
									"es-ES": translate(Locale.SpanishES, choice.name),
									"fr": translate(Locale.French, choice.name),
									"hr": translate(Locale.Hungarian, choice.name),
									"lt": translate(Locale.Lithuanian, choice.name),
									"hu": translate(Locale.Hungarian, choice.name),
									"nl": translate(Locale.Dutch, choice.name),
									"no": translate(Locale.Norwegian, choice.name),
									"pl": translate(Locale.Polish, choice.name),
									"pt-BR": translate(Locale.PortugueseBR, choice.name),
									"ro": translate(Locale.Romanian, choice.name),
									"fi": translate(Locale.Finnish, choice.name),
									"sv-SE": translate(Locale.Swedish, choice.name),
									"vi": translate(Locale.Vietnamese, choice.name),
									"tr": translate(Locale.Turkish, choice.name),
									"cs": translate(Locale.Czech, choice.name),
									"el": translate(Locale.Greek, choice.name),
									"bg": translate(Locale.Bulgarian, choice.name),
									"ru": translate(Locale.Russian, choice.name),
									"uk": translate(Locale.Ukrainian, choice.name),
									"hi": translate(Locale.Hindi, choice.name),
									"th": translate(Locale.Thai, choice.name),
									"zh-CN": translate(Locale.ChineseCN, choice.name),
									"ja": translate(Locale.Japanese, choice.name),
									"zh-TW": translate(Locale.ChineseTW, choice.name),
									"ko": translate(Locale.Korean, choice.name),
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
								name: translate(Locale.EnglishGB, opt.name),
								description: translate(Locale.EnglishGB, opt.description),
								name_localizations: {
									"da": translate(Locale.Danish, opt.name),
									"de": translate(Locale.German, opt.name),
									"en-GB": translate(Locale.EnglishGB, opt.name),
									"en-US": translate(Locale.EnglishUS, opt.name),
									"es-ES": translate(Locale.SpanishES, opt.name),
									"fr": translate(Locale.French, opt.name),
									"hr": translate(Locale.Hungarian, opt.name),
									"lt": translate(Locale.Lithuanian, opt.name),
									"hu": translate(Locale.Hungarian, opt.name),
									"nl": translate(Locale.Dutch, opt.name),
									"no": translate(Locale.Norwegian, opt.name),
									"pl": translate(Locale.Polish, opt.name),
									"pt-BR": translate(Locale.PortugueseBR, opt.name),
									"ro": translate(Locale.Romanian, opt.name),
									"fi": translate(Locale.Finnish, opt.name),
									"sv-SE": translate(Locale.Swedish, opt.name),
									"vi": translate(Locale.Vietnamese, opt.name),
									"tr": translate(Locale.Turkish, opt.name),
									"cs": translate(Locale.Czech, opt.name),
									"el": translate(Locale.Greek, opt.name),
									"bg": translate(Locale.Bulgarian, opt.name),
									"ru": translate(Locale.Russian, opt.name),
									"uk": translate(Locale.Ukrainian, opt.name),
									"hi": translate(Locale.Hindi, opt.name),
									"th": translate(Locale.Thai, opt.name),
									"zh-CN": translate(Locale.ChineseCN, opt.name),
									"ja": translate(Locale.Japanese, opt.name),
									"zh-TW": translate(Locale.ChineseTW, opt.name),
									"ko": translate(Locale.Korean, opt.name),
								},
								description_localizations: {
									"da": translate(Locale.Danish, opt.description),
									"de": translate(Locale.German, opt.description),
									"en-GB": translate(Locale.EnglishGB, opt.description),
									"en-US": translate(Locale.EnglishUS, opt.description),
									"es-ES": translate(Locale.SpanishES, opt.description),
									"fr": translate(Locale.French, opt.description),
									"hr": translate(Locale.Hungarian, opt.description),
									"it": translate(Locale.Italian, opt.description),
									"lt": translate(Locale.Lithuanian, opt.description),
									"hu": translate(Locale.Hungarian, opt.description),
									"nl": translate(Locale.Dutch, opt.description),
									"no": translate(Locale.Norwegian, opt.description),
									"pl": translate(Locale.Polish, opt.description),
									"pt-BR": translate(Locale.PortugueseBR, opt.description),
									"ro": translate(Locale.Romanian, opt.description),
									"fi": translate(Locale.Finnish, opt.description),
									"sv-SE": translate(Locale.Swedish, opt.description),
									"vi": translate(Locale.Vietnamese, opt.description),
									"tr": translate(Locale.Turkish, opt.description),
									"cs": translate(Locale.Czech, opt.description),
									"el": translate(Locale.Greek, opt.description),
									"bg": translate(Locale.Bulgarian, opt.description),
									"ru": translate(Locale.Russian, opt.description),
									"uk": translate(Locale.Ukrainian, opt.description),
									"hi": translate(Locale.Hindi, opt.description),
									"th": translate(Locale.Thai, opt.description),
									"zh-CN": translate(Locale.ChineseCN, opt.description),
									"ja": translate(Locale.Japanese, opt.description),
									"zh-TW": translate(Locale.ChineseTW, opt.description),
									"ko": translate(Locale.Korean, opt.description),
								},
							};

							if ([ApplicationCommandOptionType.String, ApplicationCommandOptionType.Number, ApplicationCommandOptionType.Integer].includes(opt.type as ApplicationCommandOptionType.String | ApplicationCommandOptionType.Number | ApplicationCommandOptionType.Integer) && opt.choices) {
								const subTransformedChoices: APIApplicationCommandOptionChoice[] = [];

								for (const choi of opt.choices) {
									subTransformedChoices.push({
										name: translate(Locale.EnglishGB, choi.name),
										name_localizations: {
											"da": translate(Locale.Danish, choi.name),
											"de": translate(Locale.German, choi.name),
											"en-GB": translate(Locale.EnglishGB, choi.name),
											"en-US": translate(Locale.EnglishUS, choi.name),
											"es-ES": translate(Locale.SpanishES, choi.name),
											"fr": translate(Locale.French, choi.name),
											"hr": translate(Locale.Hungarian, choi.name),
											"it": translate(Locale.Italian, choi.name),
											"lt": translate(Locale.Lithuanian, choi.name),
											"hu": translate(Locale.Hungarian, choi.name),
											"nl": translate(Locale.Dutch, choi.name),
											"no": translate(Locale.Norwegian, choi.name),
											"pl": translate(Locale.Polish, choi.name),
											"pt-BR": translate(Locale.PortugueseBR, choi.name),
											"ro": translate(Locale.Romanian, choi.name),
											"fi": translate(Locale.Finnish, choi.name),
											"sv-SE": translate(Locale.Swedish, choi.name),
											"vi": translate(Locale.Vietnamese, choi.name),
											"tr": translate(Locale.Turkish, choi.name),
											"cs": translate(Locale.Czech, choi.name),
											"el": translate(Locale.Greek, choi.name),
											"bg": translate(Locale.Bulgarian, choi.name),
											"ru": translate(Locale.Russian, choi.name),
											"uk": translate(Locale.Ukrainian, choi.name),
											"hi": translate(Locale.Hindi, choi.name),
											"th": translate(Locale.Thai, choi.name),
											"zh-CN": translate(Locale.ChineseCN, choi.name),
											"ja": translate(Locale.Japanese, choi.name),
											"zh-TW": translate(Locale.ChineseTW, choi.name),
											"ko": translate(Locale.Korean, choi.name),
										},
										value: choi.value
									});

									// @ts-expect-error ik it works get me out of this hell of a function
									transformedSubOption.choices = subTransformedChoices;
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
				name: translate(Locale.EnglishGB, parsed.name),
				name_localizations: {
					"da": translate(Locale.Danish, parsed.name),
					"de": translate(Locale.German, parsed.name),
					"en-GB": translate(Locale.EnglishGB, parsed.name),
					"en-US": translate(Locale.EnglishUS, parsed.name),
					"es-ES": translate(Locale.SpanishES, parsed.name),
					"fr": translate(Locale.French, parsed.name),
					"hr": translate(Locale.Hungarian, parsed.name),
					"it": translate(Locale.Italian, parsed.name),
					"lt": translate(Locale.Lithuanian, parsed.name),
					"hu": translate(Locale.Hungarian, parsed.name),
					"nl": translate(Locale.Dutch, parsed.name),
					"no": translate(Locale.Norwegian, parsed.name),
					"pl": translate(Locale.Polish, parsed.name),
					"pt-BR": translate(Locale.PortugueseBR, parsed.name),
					"ro": translate(Locale.Romanian, parsed.name),
					"fi": translate(Locale.Finnish, parsed.name),
					"sv-SE": translate(Locale.Swedish, parsed.name),
					"vi": translate(Locale.Vietnamese, parsed.name),
					"tr": translate(Locale.Turkish, parsed.name),
					"cs": translate(Locale.Czech, parsed.name),
					"el": translate(Locale.Greek, parsed.name),
					"bg": translate(Locale.Bulgarian, parsed.name),
					"ru": translate(Locale.Russian, parsed.name),
					"uk": translate(Locale.Ukrainian, parsed.name),
					"hi": translate(Locale.Hindi, parsed.name),
					"th": translate(Locale.Thai, parsed.name),
					"zh-CN": translate(Locale.ChineseCN, parsed.name),
					"ja": translate(Locale.Japanese, parsed.name),
					"zh-TW": translate(Locale.ChineseTW, parsed.name),
					"ko": translate(Locale.Korean, parsed.name),
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

export function generateNoPermissionsEmbed(interaction: Interaction): EmbedBuilder {
	return new EmbedBuilder()
		.setTimestamp()
		.setColor(0xFF5C5C)
		.setTitle(translate(interaction.locale, "NO_PERMISSIONS_TITLE"))
		.setDescription(translate(interaction.locale, "NO_PERMISSIONS_DESCRIPTION"))
		.setFooter({ text: 'Sentry', iconURL: interaction.client.user?.displayAvatarURL() ?? '' })
		.setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() });
}
