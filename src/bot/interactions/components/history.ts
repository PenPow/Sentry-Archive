import { PunishmentType } from "@prisma/client";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import { InteractionManager, ResponseType } from "../../managers/InteractionManager.js";
import { PunishmentManager } from "../../managers/PunishmentManager.js";
import { FunctionType, IFunction, PermissionTier } from "../../structures/Interaction.js";

const HistoryComponent: IFunction = {
	type: FunctionType.Button,
	id: `user-r:*-history-page-r:*-r:*`,
	permissions: PermissionTier.User,
	async execute(interaction) {
		if (!interaction.inCachedGuild()) return void await InteractionManager.sendInteractionResponse(interaction, { content: "Please run these commands in a guild!" }, ResponseType.Reply);

		const splitID = interaction.customId.split('-');
		const reconstructedID: string[] = [];

		for (const item of splitID) {
			reconstructedID.push(item.startsWith('r:') ? item.slice(2) : item);
		}

		const customId = reconstructedID.join('-');

		const data = await PunishmentManager.fetchUserPunishments(customId.split('-')[1], interaction.guildId);

		if (parseInt(customId.split('-')[4], 10) - (customId.split('-')[5] === "right" ? -1 : 1) - 1 === 0 && customId.split('-')[5] === "left") {
			const embed = new EmbedBuilder().setDescription([`<:point:995372986179780758> **${data.filter(punishment => punishment.type === PunishmentType.Ban).length}** Ban${data.filter(punishment => punishment.type === PunishmentType.Ban).length === 1 ? '' : 's'}`, `**${data.filter(punishment => punishment.type === PunishmentType.Softban).length}** Softban${data.filter(punishment => punishment.type === PunishmentType.Softban).length === 1 ? '' : 's'}`, `**${data.filter(punishment => punishment.type === PunishmentType.Kick).length}** Kick${data.filter(punishment => punishment.type === PunishmentType.Kick).length === 1 ? '' : 's'}`, `**${data.filter(punishment => punishment.type === PunishmentType.Timeout).length}** Timeout${data.filter(punishment => punishment.type === PunishmentType.Timeout).length === 1 ? '' : 's'}`, `**${data.filter(punishment => punishment.type === PunishmentType.Warn).length}** Warn${data.filter(punishment => punishment.type === PunishmentType.Warn).length === 1 ? '' : 's'}`].join('\n <:point:995372986179780758> '))
				.setTimestamp()
				.setColor(0xF79454)
				.setFooter({ text: `Page 1/${data.length + 1}` })
				.setTitle(`User History`);

			const row = new ActionRowBuilder<ButtonBuilder>().addComponents(...[new ButtonBuilder().setCustomId(`user-r:${customId.split('-')[1]}-history-page-r:1-r:left`).setEmoji('⬅️')
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(true),
			new ButtonBuilder().setCustomId(`user-r:${customId.split('-')[1]}-history-page-r:1-r:right`).setEmoji('➡️')
				.setStyle(ButtonStyle.Secondary)]);

			return void await InteractionManager.sendInteractionResponse(interaction, { ephemeral: true, embeds: [embed], components: [row] }, ResponseType.Update);
		}

		let color = 0x000000;
		switch (data[parseInt(customId.split('-')[4], 10) - (customId.split('-')[5] === "right" ? -1 : 1) - 2].type) {
			case PunishmentType.Warn:
				color = 0xFFDC5C;
				break;
			case PunishmentType.Timeout:
				color = 0x5C6CFF;
				break;
			case PunishmentType.Softban:
			case PunishmentType.Kick:
				color = 0xF79454;
				break;
			case PunishmentType.Ban:
				color = 0xFF5C5C;
				break;
			case PunishmentType.Unban:
				color = 0x5CFF9D;
				break;
		}

		const embed = new EmbedBuilder()
			.setDescription([`<:point:995372986179780758> **Member:** ${(await interaction.guild.members.fetch(data[parseInt(customId.split('-')[4], 10) - (customId.split('-')[5] === "right" ? -1 : 1) - 2].userID)).user.tag} (${data[parseInt(customId.split('-')[4], 10) - (customId.split('-')[5] === "right" ? -1 : 1) - 2].userID})`, `<:point:995372986179780758> **Action:** ${data[parseInt(customId.split('-')[4], 10) - (customId.split('-')[5] === "right" ? -1 : 1) - 2].type} ${data[parseInt(customId.split('-')[4], 10) - (customId.split('-')[5] === "right" ? -1 : 1) - 2].type === PunishmentType.Timeout && data[parseInt(customId.split('-')[4], 10) - (customId.split('-')[5] === "right" ? -1 : 1) - 2].expires ? `(<t:${Math.round(data[parseInt(customId.split('-')[4], 10) - (customId.split('-')[5] === "right" ? -1 : 1) - 2].expires!.getTime() / 1000)}:R>)` : ""}`, `<:point:995372986179780758> **Reason:** ${data[parseInt(customId.split('-')[4], 10) - (customId.split('-')[5] === "right" ? -1 : 1) - 2].reason}`].join("\n"))
			.setTimestamp()
			.setColor(color)
			.setFooter({ text: `Page ${parseInt(customId.split('-')[4], 10) - (customId.split('-')[5] === "right" ? -1 : 1)}/${data.length + 1}` })
			.setTitle(`Case #${data[parseInt(customId.split('-')[4], 10) - (customId.split('-')[5] === "right" ? -1 : 1) - 2].caseID}`);

		let newID: string | string[] = customId.split('-');
		newID = `${newID[0]}-r:${newID[1]}-history-page-r:${parseInt(customId.split('-')[4], 10) - (customId.split('-')[5] === "right" ? -1 : 1)}`;

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(...[new ButtonBuilder().setCustomId(`${newID}-r:left`).setEmoji('⬅️')
			.setStyle(ButtonStyle.Secondary)
			.setDisabled((parseInt(customId.split('-')[4], 10) - (customId.split('-')[5] === "right" ? -1 : 1)).toString() === "1" ? true : false),
		new ButtonBuilder().setCustomId(`${newID}-r:right`).setEmoji('➡️')
			.setStyle(ButtonStyle.Secondary)
			.setDisabled((parseInt(customId.split('-')[4], 10) - (customId.split('-')[5] === "right" ? -1 : 1)).toString() === (data.length + 1).toString() ? true : false)]);

		return void await InteractionManager.sendInteractionResponse(interaction, { ephemeral: true, embeds: [embed], components: [row] }, ResponseType.Update);
	},
};

export default HistoryComponent;
