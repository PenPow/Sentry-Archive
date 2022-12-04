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

export async function getArgs(interaction: APIInteraction, name: string): Promise<ApplicationCommandFetchedOptionType<ApplicationCommandOptionType> | null> {
	if(interaction.type !== InteractionType.ApplicationCommand || interaction.data.type !== ApplicationCommandType.ChatInput) throw new TypeError("Invalid Command Type");

	const option = (interaction as APIChatInputApplicationCommandInteraction).data.options?.find((option) => option.name === name);
	if(!option) return null;

	if([ApplicationCommandOptionType.Boolean, ApplicationCommandOptionType.Integer, ApplicationCommandOptionType.Number, ApplicationCommandOptionType.String].includes(option.type)) return (option as APIApplicationCommandInteractionDataBasicOption).value;
	if(option.type === ApplicationCommandOptionType.SubcommandGroup) return option;
	if(option.type === ApplicationCommandOptionType.Subcommand) return option;
	if(option.type === ApplicationCommandOptionType.Attachment) return interaction.data.resolved?.attachments ? interaction.data.resolved.attachments[option.value] ?? null : null;
	if(option.type === ApplicationCommandOptionType.Channel) return interaction.data.resolved?.channels ? interaction.data.resolved.channels[option.value] ?? null : null;
	if(option.type === ApplicationCommandOptionType.Role) return interaction.data.resolved?.roles ? interaction.data.resolved.roles[option.value] ?? null : null;
	if(option.type === ApplicationCommandOptionType.User) return interaction.data.resolved?.users ? interaction.data.resolved.users[option.value] ?? null : null;
	if(option.type === ApplicationCommandOptionType.Mentionable) return option.value;

	return null;
}

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

export type CommandInteractionsUnion = APIApplicationCommandAutocompleteInteraction | APIApplicationCommandInteraction | APIMessageComponentInteraction | APIModalSubmitInteraction

export type DataType<Type extends CommandResponseType> = 
	Type extends CommandResponseType.Reply ? RESTPostAPIWebhookWithTokenJSONBody :
	Type extends CommandResponseType.EditReply ? RESTPostAPIWebhookWithTokenJSONBody :
	Type extends CommandResponseType.FollowUp ? RESTPostAPIWebhookWithTokenJSONBody :
	Type extends CommandResponseType.Defer ? { flags?: MessageFlags } :
	Type extends CommandResponseType.MessageComponentDefer ? {} :
	Type extends CommandResponseType.AutoComplete ? APICommandAutocompleteInteractionResponseCallbackData :
	Type extends CommandResponseType.UpdateButtonMessage ? APIInteractionResponseCallbackData :
	Type extends CommandResponseType.Modal ? APIModalInteractionResponseCallbackData :
	never

export type ValidDataTypes<Interaction extends CommandInteractionsUnion> =
	Interaction extends APIApplicationCommandAutocompleteInteraction ? CommandResponseType.AutoComplete :
	Interaction extends APIApplicationCommandInteraction ? (CommandResponseType.Defer | CommandResponseType.EditReply | CommandResponseType.FollowUp | CommandResponseType.Modal | CommandResponseType.Reply) :
	Interaction extends APIMessageComponentInteraction ? (CommandResponseType.EditReply | CommandResponseType.FollowUp | CommandResponseType.MessageComponentDefer | CommandResponseType.Modal | CommandResponseType.Reply | CommandResponseType.UpdateButtonMessage) :
	Interaction extends APIModalSubmitInteraction ? (CommandResponseType.Defer | CommandResponseType.EditReply | CommandResponseType.FollowUp | CommandResponseType.Modal | CommandResponseType.Reply) :
	never

const responded: WeakMap<CommandInteractionsUnion, boolean> = new Map();

export async function respond<Interaction extends CommandInteractionsUnion, Type extends ValidDataTypes<Interaction>>(interaction: Interaction, type: Type, data: DataType<Type>) {
	switch(interaction.type) {
		case InteractionType.ApplicationCommand:
		case InteractionType.ModalSubmit:
			if(![CommandResponseType.Defer, CommandResponseType.EditReply, CommandResponseType.FollowUp, CommandResponseType.Reply, CommandResponseType.Modal].includes(type)) throw new Error(`Unexpected Type ${type} for Application Command`);
			
			if(type === CommandResponseType.Reply) {
				if(responded.has(interaction)) throw new Error("Cannot Respond to Already Responded Interaction");
				
				await api.interactions.reply(interaction.id, interaction.token, data as RESTPostAPIWebhookWithTokenJSONBody);
			} else if(type === CommandResponseType.Defer) {
				if(responded.has(interaction)) throw new Error("Cannot Respond to Already Responded Interaction");
				
				await api.rest.post(Routes.interactionCallback(interaction.id, interaction.token), { body: { type: CommandResponseType.Defer, ...data }});
			} else if(type === CommandResponseType.EditReply) {
				if(!responded.has(interaction)) throw new Error("No Response Given, but trying to edit reply");
				
				await api.interactions.editReply(interaction.application_id, interaction.token, data as RESTPostAPIWebhookWithTokenJSONBody);
			} else if(type === CommandResponseType.FollowUp) {
				if(!responded.has(interaction)) throw new Error("No Response Given, but trying to follow up");
				
				await api.interactions.followUp(interaction.application_id, interaction.token, data as RESTPostAPIWebhookWithTokenJSONBody);
			} else if(type === CommandResponseType.Modal) {
				if(responded.has(interaction)) throw new Error("Cannot Respond to Already Responded Interaction");
				
				await api.interactions.createModal(interaction.id, interaction.token, data as APIModalInteractionResponseCallbackData);
			}

			break;
		case InteractionType.ApplicationCommandAutocomplete:
			if(type !== CommandResponseType.AutoComplete) throw new Error(`Unexpected Type ${type} for Autocomplete`);

			await api.interactions.createAutocompleteResponse(interaction.id, interaction.token, data as APICommandAutocompleteInteractionResponseCallbackData);
			break;
		case InteractionType.MessageComponent:
			if(![CommandResponseType.MessageComponentDefer, CommandResponseType.EditReply, CommandResponseType.FollowUp, CommandResponseType.Reply, CommandResponseType.UpdateButtonMessage, CommandResponseType.Modal].includes(type)) throw new Error(`Unexpected Type ${type} for Application Command`);
			
			if(type === CommandResponseType.Reply) {
				if(responded.has(interaction)) throw new Error("Cannot Respond to Already Responded Interaction");
				
				await api.interactions.reply(interaction.id, interaction.token, data as RESTPostAPIWebhookWithTokenJSONBody);
			} else if(type === CommandResponseType.MessageComponentDefer) {
				if(responded.has(interaction)) throw new Error("Cannot Respond to Already Responded Interaction");
				
				await api.interactions.deferMessageUpdate(interaction.id, interaction.token);
			} else if(type === CommandResponseType.EditReply) {
				if(!responded.has(interaction)) throw new Error("No Response Given, but trying to edit reply");
				
				await api.interactions.editReply(interaction.application_id, interaction.token, data as RESTPostAPIWebhookWithTokenJSONBody);
			} else if(type === CommandResponseType.FollowUp) {
				if(!responded.has(interaction)) throw new Error("No Response Given, but trying to follow up");
				
				await api.interactions.followUp(interaction.application_id, interaction.token, data as RESTPostAPIWebhookWithTokenJSONBody);
			} else if(type === CommandResponseType.Modal) {
				if(responded.has(interaction)) throw new Error("Cannot Respond to Already Responded Interaction");
				
				await api.interactions.createModal(interaction.id, interaction.token, data as APIModalInteractionResponseCallbackData);
			} else if(type === CommandResponseType.UpdateButtonMessage) {
				if(responded.has(interaction)) throw new Error("Cannot Respond to Already Responded Interaction");
				
				await api.interactions.updateMessage(interaction.id, interaction.token, data as APIInteractionResponseCallbackData);
			}

			break;
	}

	responded.set(interaction, true);
}

export function hasResponded(interaction: CommandInteractionsUnion): boolean {
	return responded.has(interaction);
}