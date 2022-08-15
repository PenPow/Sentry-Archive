import { Result } from "@sapphire/result";
import * as Sentry from "@sentry/node";
import { ApplicationCommandType, ComponentType, InteractionType, PermissionsBitField } from "discord.js";
import { log, LogLevel } from "../../common/logger.js";
import { translate } from "../../common/translations/translate.js";
import { ResponseType, InteractionManager, store, generateNoPermissionsEmbed } from "../managers/InteractionManager.js";
import { FunctionType, PermissionTier } from "../structures/Interaction.js";
import type { IListener } from "../structures/Listener.js";

const interactionCreateListener: IListener = {
	execute: function(client) {
		client.on("interactionCreate", async interaction => {
			if (interaction.type === InteractionType.ApplicationCommand && interaction.commandType === ApplicationCommandType.ChatInput) {
				const command = store.commands.get(interaction.commandName);
				if (!command) return void await InteractionManager.sendInteractionResponse(interaction, { content: translate(interaction.locale, "COMMAND_INTERNAL_ERROR"), ephemeral: true }, ResponseType.Reply);

				let userPermission = PermissionTier.User;

				if (interaction.user.id === "207198455301537793") userPermission = PermissionTier.Developer;
				else if (interaction.guild && interaction.user.id === interaction.guild.ownerId) userPermission = PermissionTier.Owner;
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				else if ((interaction.member?.permissions as Readonly<PermissionsBitField>).has(PermissionsBitField.Flags.Administrator, true)) userPermission = PermissionTier.Admin;

				if (userPermission < command.permissions) return void await InteractionManager.sendInteractionResponse(interaction, { embeds: [generateNoPermissionsEmbed(interaction)] }, ResponseType.Reply);

				try {
					const output = await command.execute(interaction);
					if (Result.is(output)) {
						output.unwrap();
					}
				} catch (e) {
					Sentry.captureException(e);
					return void log({ level: LogLevel.Error, prefix: 'Interaction Listener' }, e as Error);
				}
			} else if (interaction.type === InteractionType.ApplicationCommand && [ApplicationCommandType.User, ApplicationCommandType.Message].includes(interaction.commandType)) {
				if (!interaction.inCachedGuild()) return void await InteractionManager.sendInteractionResponse(interaction, { content: "Please run these commands in a guild!" }, ResponseType.Reply);

				const command = store.contexts.get(interaction.commandName);
				if (!command) return void await InteractionManager.sendInteractionResponse(interaction, { content: translate(interaction.locale, "COMMAND_INTERNAL_ERROR"), ephemeral: true }, ResponseType.Reply);

				let userPermission = PermissionTier.User;

				if (interaction.user.id === "207198455301537793") userPermission = PermissionTier.Developer;
				else if (interaction.user.id === interaction.guild.ownerId) userPermission = PermissionTier.Owner;
				else if (interaction.member.permissions.has(PermissionsBitField.Flags.Administrator, true)) userPermission = PermissionTier.Admin;

				if (userPermission < command.permissions) return void await InteractionManager.sendInteractionResponse(interaction, { embeds: [generateNoPermissionsEmbed(interaction)] }, ResponseType.Reply);

				try {
					return void await command.execute(interaction);
				} catch (e) {
					Sentry.captureException(e);
					return void log({ level: LogLevel.Error, prefix: 'Interaction Listener' }, e as Error);
				}
			} else if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
				const command = store.commands.get(interaction.commandName);
				if (!command || !command.handleAutocomplete) return void await InteractionManager.sendInteractionResponse(interaction, { content: translate(interaction.locale, "COMMAND_INTERNAL_ERROR"), ephemeral: true }, ResponseType.Reply);

				let userPermission = PermissionTier.User;

				if (interaction.user.id === "207198455301537793") userPermission = PermissionTier.Developer;
				else if (interaction.guild && interaction.user.id === interaction.guild.ownerId) userPermission = PermissionTier.Owner;
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				else if ((interaction.member?.permissions as Readonly<PermissionsBitField>).has(PermissionsBitField.Flags.Administrator, true)) userPermission = PermissionTier.Admin;

				if (userPermission < command.permissions) return void await InteractionManager.sendInteractionResponse(interaction, [{ name: "Invalid Permissions", value: "-1" }]);

				try {
					return void await InteractionManager.sendInteractionResponse(interaction, await command.handleAutocomplete(interaction));
				} catch (e) {
					Sentry.captureException(e);
					return void log({ level: LogLevel.Error, prefix: 'Interaction Listener' }, e as Error);
				}
			} else if (interaction.type === InteractionType.MessageComponent && !interaction.customId.startsWith("ignore")) {
				const splitID = interaction.customId.split('-');
				const reconstructedID: string[] = [];

				for (const item of splitID) {
					reconstructedID.push(item.startsWith('r:') ? 'r:*' : item);
				}

				const command = store.components.get(reconstructedID.join('-'));
				if (!command) return void await InteractionManager.sendInteractionResponse(interaction, { content: translate(interaction.locale, "COMMAND_INTERNAL_ERROR"), ephemeral: true }, ResponseType.Reply);

				let userPermission = PermissionTier.User;

				if (interaction.user.id === "207198455301537793") userPermission = PermissionTier.Developer;
				else if (interaction.guild && interaction.user.id === interaction.guild.ownerId) userPermission = PermissionTier.Owner;
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				else if ((interaction.member?.permissions as Readonly<PermissionsBitField>).has(PermissionsBitField.Flags.Administrator, true)) userPermission = PermissionTier.Admin;

				if (userPermission < command.permissions) return void await InteractionManager.sendInteractionResponse(interaction, { embeds: [generateNoPermissionsEmbed(interaction)] }, ResponseType.Reply);

				try {
					if (interaction.componentType === ComponentType.SelectMenu && command.type === FunctionType.SelectMenu) return void await command.execute(interaction);
					else if (interaction.componentType === ComponentType.Button && command.type === FunctionType.Button) return void await command.execute(interaction);

					throw new Error("Unknown Component Type");
				} catch (e) {
					Sentry.captureException(e);
					return void log({ level: LogLevel.Error, prefix: 'Interaction Listener' }, e as Error);
				}
			}

			// eslint-disable-next-line no-useless-return
			return;
		});
	}
};

export default interactionCreateListener;
