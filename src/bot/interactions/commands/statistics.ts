import { ApplicationCommandType, EmbedBuilder } from "discord.js";
import { redis } from "../../../common/db.js";
import { translate } from "../../../common/translations/translate.js";
import { InteractionManager, ResponseType } from "../../managers/InteractionManager.js";
import { FunctionType, IFunction, PermissionTier } from "../../structures/Interaction.js";

const StatisticsCommand: IFunction = {
	type: FunctionType.ChatInput,
	permissions: PermissionTier.User,
	async execute(interaction) {
		const embed = new EmbedBuilder()
			.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
			.setTimestamp()
			.setColor(0x202225)
			.setDescription(translate(interaction.locale, "STATISTICS_EMBED_DESCRIPTION", parseInt(await redis.get(`stats-warns`) ?? '0', 10) + parseInt(await redis.get(`stats-bans`) ?? '0', 10) + parseInt(await redis.get(`stats-timeouts`) ?? '0', 10) + parseInt(await redis.get(`stats-softbans`) ?? '0', 10) + parseInt(await redis.get(`stats-kicks`) ?? '0', 10), interaction.client.guilds.cache.size, await redis.get("users-2fa") ?? "0"))
			.setTitle(translate(interaction.locale, "STATISTICS_EMBED_TITLE"));

		return void await InteractionManager.sendInteractionResponse(interaction, { ephemeral: true, embeds: [embed] }, ResponseType.Reply);
	},
	toJSON() {
		return {
			name: "STATISTICS_COMMAND_NAME",
			description: "STATISTICS_COMMAND_DESCRIPTION",
			type: ApplicationCommandType.ChatInput,
		};
	},
};

export default StatisticsCommand;
