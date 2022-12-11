import { Result } from "@sapphire/result";
import {
  type APIApplicationCommandAutocompleteInteraction,
  type APIApplicationCommandInteraction,
  type APIApplicationCommandInteractionDataBasicOption,
  type APIChatInputApplicationCommandInteraction,
  type APICommandAutocompleteInteractionResponseCallbackData,
  type APIInteraction,
  type APIInteractionResponseCallbackData,
  type APIMessageComponentInteraction,
  type APIModalInteractionResponseCallbackData,
  type APIModalSubmitInteraction,
  type RESTPostAPIWebhookWithTokenJSONBody,
  type APIInteractionDataResolvedChannel,
  type APIRole,
  type APIUser,
  type Snowflake,
  type APIAttachment,
  type APIApplicationCommandInteractionDataSubcommandOption,
  type APIApplicationCommandInteractionDataSubcommandGroupOption,
  type MessageFlags,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  InteractionType,
  Routes,
} from "discord-api-types/v10";
import { api } from "../REST.js";

/**
 * Utility Type to convert an option type to its primitive
 *
 * @internal
 * @typeParam T - Application option type to convert to primitive
 * @example
 * ```ts
 * type StringOptionType = ApplicationCommandFetchedOptionType<ApplicationCommandOptionType.String> // string
 * type UserOptionType = ApplicationCommandFetchedOptionType<ApplicationCommandOptionType.User> // APIUser
 * type AttachmentOptionType = ApplicationCommandFetchedOptionType<ApplicationCommandOptionType.Attachment> // APIAttachment
 * ```
 */
export type ApplicationCommandFetchedOptionType<
  T extends ApplicationCommandOptionType
> = T extends ApplicationCommandOptionType.String
  ? string
  : T extends ApplicationCommandOptionType.Number
  ? number
  : T extends ApplicationCommandOptionType.Integer
  ? number
  : T extends ApplicationCommandOptionType.Boolean
  ? boolean
  : T extends ApplicationCommandOptionType.Channel
  ? APIInteractionDataResolvedChannel
  : T extends ApplicationCommandOptionType.Role
  ? APIRole
  : T extends ApplicationCommandOptionType.User
  ? APIUser
  : T extends ApplicationCommandOptionType.Mentionable
  ? Snowflake
  : T extends ApplicationCommandOptionType.Attachment
  ? APIAttachment
  : T extends ApplicationCommandOptionType.Subcommand
  ? APIApplicationCommandInteractionDataSubcommandOption
  : T extends ApplicationCommandOptionType.SubcommandGroup
  ? APIApplicationCommandInteractionDataSubcommandGroupOption
  : never;

/**
 * Helper function that takes an interaction and extracts its options
 *
 * @remarks This function definition is incompatible with the usage. The type signature of the function implemented by {@link RunContext} provides type safety, this is a generic function to handle any interaction from any command.
 * @public
 * @param interaction - Interaction to get options from
 * @param name - Name of the option to fetch
 * @returns The resolved type from {@link ApplicationCommandFetchedOptionType}
 */
export async function getArgs(
  interaction: APIInteraction,
  name: string
): Promise<ApplicationCommandFetchedOptionType<ApplicationCommandOptionType> | null> {
  if (
    interaction.type !== InteractionType.ApplicationCommand ||
    interaction.data.type !== ApplicationCommandType.ChatInput
  )
    throw new TypeError("Invalid Command Type");

  const option = (
    interaction as APIChatInputApplicationCommandInteraction
  ).data.options?.find((option) => option.name === name);
  if (!option) return null;

  if (
    [
      ApplicationCommandOptionType.Boolean,
      ApplicationCommandOptionType.Integer,
      ApplicationCommandOptionType.Number,
      ApplicationCommandOptionType.String,
    ].includes(option.type)
  )
    return (option as APIApplicationCommandInteractionDataBasicOption).value;
  if (option.type === ApplicationCommandOptionType.SubcommandGroup)
    return option;
  if (option.type === ApplicationCommandOptionType.Subcommand) return option;
  if (option.type === ApplicationCommandOptionType.Attachment)
    return interaction.data.resolved?.attachments
      ? interaction.data.resolved.attachments[option.value] ?? null
      : null;
  if (option.type === ApplicationCommandOptionType.Channel)
    return interaction.data.resolved?.channels
      ? interaction.data.resolved.channels[option.value] ?? null
      : null;
  if (option.type === ApplicationCommandOptionType.Role)
    return interaction.data.resolved?.roles
      ? interaction.data.resolved.roles[option.value] ?? null
      : null;
  if (option.type === ApplicationCommandOptionType.User)
    return interaction.data.resolved?.users
      ? interaction.data.resolved.users[option.value] ?? null
      : null;
  if (option.type === ApplicationCommandOptionType.Mentionable)
    return option.value;

  return null;
}

/**
 * Enum of the possible response types
 *
 * @public
 * @remarks Reply to Modal are classed as "responses" by Discord, and so are numbered in accordance with their response types.
 * @privateRemarks EditReply and FollowUp are not responses by discord, but are handled in our respond function, their values are stubs
 */
export enum CommandResponseType {
  Reply = 4,
  Defer,
  MessageComponentDefer,
  UpdateButtonMessage,
  AutoComplete,
  Modal,
  EditReply = -1, // These arent classified as "responses", but im including them here as they are used to respond after a defer
  FollowUp = -2,
}

/**
 * Union of all types of commands that are not special (ie APIPingInteractions)
 *
 * @public
 */
export type CommandInteractionsUnion =
  | APIApplicationCommandAutocompleteInteraction
  | APIApplicationCommandInteraction
  | APIMessageComponentInteraction
  | APIModalSubmitInteraction;

/**
 * Utility Type Function to convert a {@link CommandResponseType} to its appropriate data type
 *
 * @internal
 * @typeParam Type - {@link CommandResponseType} to convert to a data type
 */
export type DataType<Type extends CommandResponseType> =
  Type extends CommandResponseType.Reply
    ? RESTPostAPIWebhookWithTokenJSONBody
    : Type extends CommandResponseType.EditReply
    ? RESTPostAPIWebhookWithTokenJSONBody
    : Type extends CommandResponseType.FollowUp
    ? RESTPostAPIWebhookWithTokenJSONBody
    : Type extends CommandResponseType.Defer
    ? { flags?: MessageFlags }
    : Type extends CommandResponseType.MessageComponentDefer
    ? {}
    : Type extends CommandResponseType.AutoComplete
    ? APICommandAutocompleteInteractionResponseCallbackData
    : Type extends CommandResponseType.UpdateButtonMessage
    ? APIInteractionResponseCallbackData
    : Type extends CommandResponseType.Modal
    ? APIModalInteractionResponseCallbackData
    : never;

/**
 * Utility Type Function to convert a {@link CommandInteractionsUnion} to appropriate {@link CommandResponseType}
 *
 * @internal
 * @typeParam Interaction - One of the members of the {@link CommandInteractionsUnion} to convert to possible response types
 */
export type ValidDataTypes<Interaction extends CommandInteractionsUnion> =
  Interaction extends APIApplicationCommandAutocompleteInteraction
    ? CommandResponseType.AutoComplete
    : Interaction extends APIApplicationCommandInteraction
    ?
        | CommandResponseType.Defer
        | CommandResponseType.EditReply
        | CommandResponseType.FollowUp
        | CommandResponseType.Modal
        | CommandResponseType.Reply
    : Interaction extends APIMessageComponentInteraction
    ?
        | CommandResponseType.EditReply
        | CommandResponseType.FollowUp
        | CommandResponseType.MessageComponentDefer
        | CommandResponseType.Modal
        | CommandResponseType.Reply
        | CommandResponseType.UpdateButtonMessage
    : Interaction extends APIModalSubmitInteraction
    ?
        | CommandResponseType.Defer
        | CommandResponseType.EditReply
        | CommandResponseType.FollowUp
        | CommandResponseType.Modal
        | CommandResponseType.Reply
    : never;

const responded: WeakMap<CommandInteractionsUnion, boolean> = new Map();

/**
 * Function to respond to an interaction, handling the data types and errors
 *
 * @public
 * @throws Error if we have already responded/not responded depending on interaction type
 * @throws DiscordAPIError if there is another issue that we havent handled (yet)
 * @typeParam Interaction - Interaction from the {@link CommandInteractionsUnion} that we want to respond to
 * @typeParam Type - The valid response types for the interaction
 * @see {@link ValidDataTypes} for the implementation of the response types
 * @param interaction - Interaction to respond to
 * @param type - The type of response we want to give
 * @param data - The data we want to respond with
 * @see {@link DataType} for the data types we can respond with for each response type
 */
export async function respond<
  Interaction extends CommandInteractionsUnion,
  Type extends ValidDataTypes<Interaction>
>(interaction: Interaction, type: Type, data: DataType<Type>): Promise<Result<true, Error>> {
    try {
		switch (interaction.type) {
			case InteractionType.ApplicationCommand:
			case InteractionType.ModalSubmit:
			if (
				![
				CommandResponseType.Defer,
				CommandResponseType.EditReply,
				CommandResponseType.FollowUp,
				CommandResponseType.Reply,
				CommandResponseType.Modal,
				].includes(type)
			)
				throw new Error(`Unexpected Type ${type} for Application Command`);

			if (type === CommandResponseType.Reply) {
				if (hasResponded(interaction))
				throw new Error("Cannot Respond to Already Responded Interaction");

				await api.interactions.reply(
				interaction.id,
				interaction.token,
				data as RESTPostAPIWebhookWithTokenJSONBody
				);
			} else if (type === CommandResponseType.Defer) {
				if (hasResponded(interaction))
				throw new Error("Cannot Respond to Already Responded Interaction");

				await api.rest.post(
				Routes.interactionCallback(interaction.id, interaction.token),
				{ body: { type: CommandResponseType.Defer, ...data } }
				);
			} else if (type === CommandResponseType.EditReply) {
				if (!hasResponded(interaction))
				throw new Error("No Response Given, but trying to edit reply");

				await api.interactions.editReply(
				interaction.application_id,
				interaction.token,
				data as RESTPostAPIWebhookWithTokenJSONBody
				);
			} else if (type === CommandResponseType.FollowUp) {
				if (!hasResponded(interaction))
				throw new Error("No Response Given, but trying to follow up");

				await api.interactions.followUp(
				interaction.application_id,
				interaction.token,
				data as RESTPostAPIWebhookWithTokenJSONBody
				);
			} else if (type === CommandResponseType.Modal) {
				if (hasResponded(interaction))
				throw new Error("Cannot Respond to Already Responded Interaction");

				await api.interactions.createModal(
				interaction.id,
				interaction.token,
				data as APIModalInteractionResponseCallbackData
				);
			}

			break;
			case InteractionType.ApplicationCommandAutocomplete:
			if (type !== CommandResponseType.AutoComplete)
				throw new Error(`Unexpected Type ${type} for Autocomplete`);

			await api.interactions.createAutocompleteResponse(
				interaction.id,
				interaction.token,
				data as APICommandAutocompleteInteractionResponseCallbackData
			);
			break;
			case InteractionType.MessageComponent:
			if (
				![
				CommandResponseType.MessageComponentDefer,
				CommandResponseType.EditReply,
				CommandResponseType.FollowUp,
				CommandResponseType.Reply,
				CommandResponseType.UpdateButtonMessage,
				CommandResponseType.Modal,
				].includes(type)
			)
				throw new Error(`Unexpected Type ${type} for Application Command`);

			if (type === CommandResponseType.Reply) {
				if (hasResponded(interaction))
				throw new Error("Cannot Respond to Already Responded Interaction");

				await api.interactions.reply(
				interaction.id,
				interaction.token,
				data as RESTPostAPIWebhookWithTokenJSONBody
				);
			} else if (type === CommandResponseType.MessageComponentDefer) {
				if (hasResponded(interaction))
				throw new Error("Cannot Respond to Already Responded Interaction");

				await api.interactions.deferMessageUpdate(
				interaction.id,
				interaction.token
				);
			} else if (type === CommandResponseType.EditReply) {
				if (!hasResponded(interaction))
				throw new Error("No Response Given, but trying to edit reply");

				await api.interactions.editReply(
				interaction.application_id,
				interaction.token,
				data as RESTPostAPIWebhookWithTokenJSONBody
				);
			} else if (type === CommandResponseType.FollowUp) {
				if (!hasResponded(interaction))
				throw new Error("No Response Given, but trying to follow up");

				await api.interactions.followUp(
				interaction.application_id,
				interaction.token,
				data as RESTPostAPIWebhookWithTokenJSONBody
				);
			} else if (type === CommandResponseType.Modal) {
				if (hasResponded(interaction))
				throw new Error("Cannot Respond to Already Responded Interaction");

				await api.interactions.createModal(
				interaction.id,
				interaction.token,
				data as APIModalInteractionResponseCallbackData
				);
			} else if (type === CommandResponseType.UpdateButtonMessage) {
				if (hasResponded(interaction))
				throw new Error("Cannot Respond to Already Responded Interaction");

				await api.interactions.updateMessage(
				interaction.id,
				interaction.token,
				data as APIInteractionResponseCallbackData
				);
			}

			break;
		}

		responded.set(interaction, true);

		return Result.ok(true);
	} catch(error) {
		return Result.err(error as Error);
	}
}

/**
 * Small utility function to check whether we have responded to an interaction already
 *
 * @internal
 * @param interaction - Interaction to check if we have responded to
 * @returns Whether we have already responded to an interaction
 */
export function hasResponded(interaction: CommandInteractionsUnion): boolean {
  return responded.has(interaction);
}
