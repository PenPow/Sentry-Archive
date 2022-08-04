import { ApplicationCommandOptionType, ApplicationCommandType, ChannelType, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import ms from "ms";
import { translate } from "../../../common/translations/translate.js";
import { InteractionManager, ResponseType } from "../../managers/InteractionManager.js";
import { FunctionType, IFunction, PermissionTier } from "../../structures/Interaction.js";

const SlowmodeCommand: IFunction = {
	type: FunctionType.ChatInput,
	permissions: PermissionTier.User,
	async execute(interaction) {
		if (!interaction.guild.members.me?.permissions.has(PermissionFlagsBits.ManageChannels, true)) {
			const embed = new EmbedBuilder()
				.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
				.setTimestamp()
				.setColor(0xFF5C5C)
				.setTitle(`❌ Cannot Modify Slowmode`);

			return void await InteractionManager.sendInteractionResponse(interaction, { ephemeral: true, embeds: [embed], components: [] }, ResponseType.Reply);
		}

		await interaction.channel?.setRateLimitPerUser(interaction.options.getNumber(translate("en-GB", "TIMEOUT_DURATION_OPTION_NAME"), true), interaction.options.getString(translate("en-GB", "MODERATION_REASON_OPTION_NAME")) ?? translate("en-GB", "MODERATION_DEFAULT_REASON"));

		const logChannel = interaction.guild.channels.cache.find(val => ["logs", "audit-logs", "server-logs", "sentry-logs", "guild-logs", "mod-logs", "modlogs"].includes(val.name));
		const embed = new EmbedBuilder()
			.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
			.setTimestamp()
			.setColor(0x5C6CFF)
			// eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-call
			.setDescription([`<:point:995372986179780758> **Channel:** <#${interaction.channel?.id}>`, `<:point:995372986179780758> **Action:** Slowmode`, `<:point:995372986179780758> **Delay**: ${ms(interaction.options.getNumber(translate("en-GB", "TIMEOUT_DURATION_OPTION_NAME"), true) * 1000)}`, `<:point:995372986179780758> **Reason:** ${interaction.options.getString(translate("en-GB", "MODERATION_REASON_OPTION_NAME")) ?? translate("en-GB", "MODERATION_DEFAULT_REASON")}`].join("\n"))
			.setFooter({ text: `Slowmode` });

		await InteractionManager.sendInteractionResponse(interaction, { ephemeral: true, embeds: [embed] }, ResponseType.Reply);

		if (!logChannel || logChannel.type !== ChannelType.GuildText) return;
		return void await logChannel.send({ embeds: [embed] }).catch();
	},
	toJSON() {
		return {
			name: "SLOWMODE_COMMAND_NAME",
			description: "SLOWMODE_COMMAND_DESCRIPTION",
			type: ApplicationCommandType.ChatInput,
			default_member_permissions: PermissionFlagsBits.ManageChannels.toString(),
			options: [{
				name: "TIMEOUT_DURATION_OPTION_NAME",
				description: "SLOWMODE_DURATION_OPTION_DESCRIPTION",
				type: ApplicationCommandOptionType.Number,
				min_value: 0,
				max_value: 21599,
				required: true
			},
			{
				name: "MODERATION_REASON_OPTION_NAME",
				description: "MODERATION_REASON_OPTION_DESCRIPTION",
				type: ApplicationCommandOptionType.String,
				required: false
			}]
		};
	},
};

export default SlowmodeCommand;
