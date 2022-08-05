import { PunishmentType } from "@prisma/client";
import { APIButtonComponentWithCustomId, ApplicationCommandOptionType, ApplicationCommandType, ComponentType, EmbedBuilder, InteractionResponse, Message, PermissionFlagsBits } from "discord.js";
import { translate } from "../../../common/translations/translate.js";
import { InteractionManager, ResponseType } from "../../managers/InteractionManager.js";
import { PunishmentManager } from "../../managers/PunishmentManager.js";
import { FunctionType, IFunction, PermissionTier } from "../../structures/Interaction.js";

const SoftbanCommand: IFunction = {
	type: FunctionType.ChatInput,
	permissions: PermissionTier.User,
	async execute(interaction) {
		// await InteractionManager.sendInteractionResponse(interaction, { ephemeral: true }, ResponseType.Defer);

		const [success, modal] = await PunishmentManager.handleUser2FA(interaction, interaction.user.id);

		if (!success) return;

		if (!(await PunishmentManager.canPunish(interaction.client, PunishmentType.Softban, interaction.options.getUser(translate("en-GB", "MODERATION_TARGET_OPTION_NAME"), true).id, interaction.user.id, interaction.guildId))) {
			const embed = new EmbedBuilder()
				.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
				.setTimestamp()
				.setColor(0xFF5C5C)
				.setTitle(`❌ Cannot Punish User`);

			return void await InteractionManager.sendInteractionResponse(modal ?? interaction, { ephemeral: true, embeds: [embed], components: [] }, ResponseType.Reply);
		}

		const [embed, row] = await PunishmentManager.createPunishmentPrompt(interaction.options.getUser(translate("en-GB", "MODERATION_TARGET_OPTION_NAME"), true), interaction.guildId);

		const res = await InteractionManager.sendInteractionResponse(modal ?? interaction, { ephemeral: true, embeds: [embed], components: [row], fetchReply: true }, ResponseType.Reply);

		if (res.isErr()) {
			const embed = new EmbedBuilder()
				.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
				.setTimestamp()
				.setColor(0xFF5C5C)
				.setTitle(`❌ An Error Occurred`);

			return void await InteractionManager.sendInteractionResponse(modal ?? interaction, { ephemeral: true, embeds: [embed], components: [] }, ResponseType.FollowUp);
		}

		const int = res.unwrap();

		if (!(int instanceof InteractionResponse) && !(int instanceof Message)) return;

		const response = await int.awaitMessageComponent({ componentType: ComponentType.Button, time: 120000, filter: i => [(row.components[0].toJSON() as APIButtonComponentWithCustomId).custom_id, (row.components[1].toJSON() as APIButtonComponentWithCustomId).custom_id].includes(i.customId) && i.user.id === interaction.user.id }).catch(async () => {
			const embed = new EmbedBuilder()
				.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
				.setTimestamp()
				.setColor(0xFF5C5C)
				.setTitle(`❌ Cancelled`);

			void await InteractionManager.sendInteractionResponse(modal ?? interaction, { ephemeral: true, embeds: [embed], components: [] }, ResponseType.FollowUp);
		});

		if (!response) return;

		switch (response.customId) {
			case (row.components[0].toJSON() as APIButtonComponentWithCustomId).custom_id:
				// eslint-disable-next-line no-case-declarations
				const punishment = await PunishmentManager.createPunishment(interaction.client, { type: PunishmentType.Softban, userID: interaction.options.getUser(translate("en-GB", "MODERATION_TARGET_OPTION_NAME"), true).id, guildID: interaction.guildId, reason: interaction.options.getString(translate("en-GB", "MODERATION_REASON_OPTION_NAME")) ?? translate("en-GB", "MODERATION_DEFAULT_REASON"), moderator: interaction.user.id, expires: null, reference: interaction.options.getNumber(translate("en-GB", "MODERATION_REFERENCE_OPTION_NAME")) });

				if (punishment.isErr()) {
					const embed = new EmbedBuilder()
						.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
						.setTimestamp()
						.setColor(0xFF5C5C)
						.setTitle(`❌ An Error Occurred`);

					return void await InteractionManager.sendInteractionResponse(response, { ephemeral: true, embeds: [embed], components: [] }, ResponseType.Update);
				}
				return void await InteractionManager.sendInteractionResponse(response, { ephemeral: true, embeds: [punishment.unwrap()], components: [] }, ResponseType.Update);
			default:
			case (row.components[1].toJSON() as APIButtonComponentWithCustomId).custom_id:
				// eslint-disable-next-line no-case-declarations
				const embed = new EmbedBuilder()
					.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
					.setTimestamp()
					.setColor(0xFF5C5C)
					.setTitle(`❌ Cancelled`);
				return void await InteractionManager.sendInteractionResponse(response, { ephemeral: true, embeds: [embed], components: [] }, ResponseType.Update);
		}
	},
	toJSON() {
		return {
			name: "SOFTBAN_COMMAND_NAME",
			description: "SOFTBAN_COMMAND_DESCRIPTION",
			type: ApplicationCommandType.ChatInput,
			default_member_permissions: PermissionFlagsBits.BanMembers.toString(),
			options: [{
				name: "MODERATION_TARGET_OPTION_NAME",
				description: "MODERATION_TARGET_OPTION_DESCRIPTION",
				type: ApplicationCommandOptionType.User,
				required: true
			},
			{
				name: "MODERATION_REASON_OPTION_NAME",
				description: "MODERATION_REASON_OPTION_DESCRIPTION",
				type: ApplicationCommandOptionType.String,
				required: false
			},
			{
				name: "MODERATION_REFERENCE_OPTION_NAME",
				description: "MODERATION_REFERENCE_OPTION_DESCRIPTION",
				type: ApplicationCommandOptionType.Number,
				min_value: 0,
				required: false
			}]
		};
	},
};

export default SoftbanCommand;
