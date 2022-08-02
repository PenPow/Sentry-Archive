import { Punishment, PunishmentType } from "@prisma/client";
import { Result } from "@sapphire/result";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, Client, EmbedBuilder, PermissionsBitField, Snowflake, User } from "discord.js";
import { nanoid } from "nanoid";
import { prisma, redis } from "../../common/db.js";
import { translate } from "../../common/translations/translate.js";

export const PunishmentManager = {
	getHeat: async function(guildId: Snowflake, userId: Snowflake): Promise<number> { return parseInt(await redis.get(`${guildId}-${userId}-heat`) ?? '0', 10); },
	setHeat: async function(guildId: Snowflake, userId: Snowflake, heat: number): Promise<Result<number, Error>> {
		try {
			const ttl = await redis.ttl(`${guildId}-${userId}-heat`);
			const userHeat = await this.getHeat(guildId, userId);
			await redis.setex(`${guildId}-${userId}-heat`, (ttl === -2 ? 0 : ttl) + 3, userHeat + heat);

			return Result.ok(userHeat + heat);
		} catch (e) {
			return Result.err(e as Error);
		}
	},
	createPunishment: async function(client: Client, data: Omit<Punishment, 'id' | 'createdAt' | 'modLogID' | 'caseID'>): Promise<Result<EmbedBuilder, Error>> {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		if (!(await this.canPunish(client, data.type, data.userID, data.moderator, data.guildID))) return Result.err(new Error("Cannot Moderate"));

		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		const guild = await client.guilds.fetch(data.guildID); // idk why but eslint doesnt like this

		try {
			switch (data.type) {
				case PunishmentType.Warn:
					break;
				case PunishmentType.AntiRaidNuke:
				case PunishmentType.Ban:
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					await guild.bans.create(data.userID, { deleteMessageDays: 7, reason: data.type === PunishmentType.Ban ? data.reason : translate("en-GB", "ANTI_RAID_NUKE_PUNISHMENT_REASON") });
					break;
				case PunishmentType.Timeout:
					if (!data.expires) throw new Error("No Expiry Provided");
					// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
					await (await guild.members.fetch(data.userID)).disableCommunicationUntil(data.expires, data.reason);
					break;
				case PunishmentType.Softban:
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					await guild.bans.create(data.userID, { deleteMessageDays: 7, reason: data.reason });
					await guild.bans.remove(data.userID, translate("en-GB", "SOFTBAN_UNBAN_REASON"));
					break;
				case PunishmentType.Kick:
					// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
					await (await guild.members.fetch(data.userID)).kick(data.reason);
					break;
				case PunishmentType.Unban:
					await guild.bans.remove(data.userID, data.reason);
					break;
			}
		} catch (e) {
			return Result.err(e as Error);
		}

		const caseID = await this.fetchPunishmentId(data.guildID);

		await prisma.guild.upsert({ create: { id: guild.id }, update: {}, where: { id: guild.id } });
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		const result = await prisma.punishment.create({ data: { caseID, ...data } }).catch(e => new Error(e));

		let color = 0x000000;

		switch (data.type) {
			case PunishmentType.Warn:
				color = 0xFFDC5C;
				break;
			case PunishmentType.Timeout:
				color = 0x5C6CFF;
				break;
			case PunishmentType.Kick:
				color = 0xF79454;
				break;
			case PunishmentType.Softban:
			case PunishmentType.Ban:
				color = 0xFF5C5C;
				break;
			case PunishmentType.Unban:
				color = 0x5CFF9D;
				break;
			case PunishmentType.AntiRaidNuke:
				color = 0x202225;
				break;
		}

		const embed = new EmbedBuilder()
			.setAuthor({ iconURL: client.user!.displayAvatarURL(), name: `${client.user!.tag} (${client.user!.id})` })
			.setTimestamp()
			.setColor(color)
			// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
			.setDescription([`<:point:995372986179780758> **Member:** ${(await guild.members.fetch(data.userID)).user.tag} (${((await guild.members.fetch(data.userID)).id)})`, `<:point:995372986179780758> **Action:** ${data.type === PunishmentType.AntiRaidNuke ? "Anti Raid Nuke" : data.type} ${data.type === PunishmentType.Timeout && data.expires ? `(<t:${Math.round(data.expires.getTime() / 1000)}:R>)` : ""}`, `<:point:995372986179780758> **Reason:** ${data.reason}`].join("\n"))
			.setFooter({ text: `Case #${caseID}` });

		const logChannel = guild.channels.cache.find(val => ["logs", "audit-logs", "server-logs", "sentry-logs", "guild-logs", "mod-logs", "modlogs"].includes(val.name));
		if (!logChannel || logChannel.type !== ChannelType.GuildText) return result instanceof Error ? Result.err(result) : Result.ok(embed);

		const log = await logChannel.send({ embeds: [embed] });

		!(result instanceof Error) && await prisma.punishment.update({ where: { id: result.id }, data: { modLogID: log.id } });

		return result instanceof Error ? Result.err(result) : Result.ok(embed);
	},
	fetchPunishmentId: async function(guildId: Snowflake): Promise<number> {
		const caseNumber = parseInt(await redis.get(`${guildId}-caseNo`) ?? '-1', 10) + 1;
		await redis.set(`${guildId}-caseNo`, caseNumber);

		return caseNumber;
	},
	fetchUserPunishments: async function(userId: Snowflake): Promise<Punishment[]> {
		await prisma.user.upsert({ create: { id: userId }, update: {}, where: { id: userId } });

		return (await prisma.user.findUnique({ where: { id: userId }, include: { punishments: true } }))?.punishments ?? [];
	},
	canPunish: async function(client: Client, type: PunishmentType, user: Snowflake, punisher: Snowflake, guildId: Snowflake): Promise<boolean> {
		const member = await (await client.guilds.fetch(guildId)).members.fetch(user);
		const moderator = await (await client.guilds.fetch(guildId)).members.fetch(punisher);
		const me = (await client.guilds.fetch(guildId)).members.me;

		if (member.user.bot || (await client.guilds.fetch(guildId)).ownerId === member.id || member.id === moderator.id) return false;

		if (member.permissions.has(PermissionsBitField.Flags.Administrator, true)) return false;

		if (([PunishmentType.Ban, PunishmentType.AntiRaidNuke, PunishmentType.Softban] as PunishmentType[]).includes(type)) {
			if (!moderator.permissions.has(PermissionsBitField.Flags.BanMembers, true)) return false;
			if (!me?.permissions.has(PermissionsBitField.Flags.BanMembers, true)) return false;
			if (!member.bannable) return false;
		}

		if (type === PunishmentType.Kick) {
			if (!moderator.permissions.has(PermissionsBitField.Flags.KickMembers, true)) return false;
			if (!me?.permissions.has(PermissionsBitField.Flags.KickMembers, true)) return false;
			if (!member.kickable) return false;
		}

		if (type === PunishmentType.Timeout) {
			if (!moderator.permissions.has(PermissionsBitField.Flags.ModerateMembers, true)) return false;
			if (!me?.permissions.has(PermissionsBitField.Flags.ModerateMembers, true)) return false;
			if (Date.now() < (member.communicationDisabledUntilTimestamp ?? 0)) return false;
			if (!member.moderatable) return false;
		}

		return true;
	},
	createPunishmentPrompt: async function(user: User): Promise<[EmbedBuilder, ActionRowBuilder<ButtonBuilder>]> {
		const punishments = await this.fetchUserPunishments(user.id);

		return [new EmbedBuilder()
			.setAuthor({ iconURL: user.displayAvatarURL(), name: `${user.tag} (${user.id})` })
			.setTimestamp()
			.setColor(0xF79454)
			.setTitle(`Are you sure you want to ban ${user.tag}`)
			.setDescription([`<:point:995372986179780758> **${punishments.filter(punishment => punishment.type === PunishmentType.Ban).length}** Ban${punishments.filter(punishment => punishment.type === PunishmentType.Ban).length === 1 ? '' : 's'}`, `**${punishments.filter(punishment => punishment.type === PunishmentType.Softban).length}** Softban${punishments.filter(punishment => punishment.type === PunishmentType.Softban).length === 1 ? '' : 's'}`, `**${punishments.filter(punishment => punishment.type === PunishmentType.Kick).length}** Kick${punishments.filter(punishment => punishment.type === PunishmentType.Kick).length === 1 ? '' : 's'}`, `**${punishments.filter(punishment => punishment.type === PunishmentType.Timeout).length}** Timeout${punishments.filter(punishment => punishment.type === PunishmentType.Timeout).length === 1 ? '' : 's'}`, `**${punishments.filter(punishment => punishment.type === PunishmentType.Warn).length}** Warn${punishments.filter(punishment => punishment.type === PunishmentType.Warn).length === 1 ? '' : 's'}`].join('\n <:point:995372986179780758> ')), new ActionRowBuilder<ButtonBuilder>().addComponents(...[new ButtonBuilder().setCustomId(`ignore-${nanoid()}-punishment-prompt-accept`).setEmoji('🔨')
			.setStyle(ButtonStyle.Primary)
			.setLabel('Punish'), new ButtonBuilder().setCustomId(`ignore-${nanoid()}-punishment-prompt-decline`).setEmoji('❌')
			.setStyle(ButtonStyle.Secondary)
			.setLabel('Cancel')])];
	}
};
