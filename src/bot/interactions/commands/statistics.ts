import { ApplicationCommandType, EmbedBuilder } from "discord.js";
import { redis } from "../../../common/db.js";
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
			.setDescription([`<:point:995372986179780758> Since I was created, I have punished ${parseInt(await redis.get(`stats-warns`) ?? '0', 10) + parseInt(await redis.get(`stats-bans`) ?? '0', 10) + parseInt(await redis.get(`stats-timeouts`) ?? '0', 10) + parseInt(await redis.get(`stats-softbans`) ?? '0', 10) + parseInt(await redis.get(`stats-kicks`) ?? '0', 10)} users`, `<:point:995372986179780758> In my ${interaction.client.guilds.cache.size} *ish* guilds, I have met ${await redis.get("users-2fa") ?? "0"} users who have enabled 2FA`].join('\n\n'))
			.setTitle(`<:sentry:942693843269218334> Statistics`);

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
