import speakeasy from "@levminer/speakeasy";
import { Punishment, PunishmentType } from "@prisma/client";
import { Result } from "@sapphire/result";
import * as Sentry from "@sentry/node";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, ChatInputCommandInteraction, Client, ContextMenuCommandInteraction, EmbedBuilder, Guild, GuildMember, GuildMFALevel, ModalBuilder, ModalSubmitInteraction, PermissionsBitField, Snowflake, TextInputBuilder, TextInputStyle, User } from "discord.js";
import { nanoid } from "nanoid";
import { InteractionManager, ResponseType } from "./InteractionManager.js";
import { SettingsManager } from "./SettingsManager.js";
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
			Sentry.captureException(e);
			return Result.err(e as Error);
		}
	},
	createPunishment: async function(client: Client, data: Omit<Punishment, 'id' | 'createdAt' | 'modLogID' | 'caseID' | 'modLogChannelID'>): Promise<Result<EmbedBuilder, Error>> {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		if (!(await this.canPunish(client, data.type, data.userID, data.moderator, data.guildID))) return Result.err(new Error("Cannot Moderate"));

		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		const guild = await client.guilds.fetch(data.guildID); // idk why but eslint doesnt like this

		try {
			switch (data.type) {
				case PunishmentType.Warn:
					break;
				case PunishmentType.Ban:
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					await guild.bans.create(data.userID, { deleteMessageDays: 7, reason: data.reason });
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
			Sentry.captureException(e);
			return Result.err(e as Error);
		}

		const caseID = await this.fetchPunishmentId(data.guildID);

		await prisma.guild.upsert({ create: { id: guild.id }, update: {}, where: { id: guild.id } });
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		const result = await prisma.punishment.create({ data: { caseID, ...data, reason: data.reason.substring(0, 900) } }).catch(e => new Error(e));

		if ((await SettingsManager.getSettings(data.guildID)).statistics) {
			switch (data.type) {
				case PunishmentType.Warn:
					await redis.incr(`stats-warns`);
					break;
				case PunishmentType.Ban:
					await redis.incr(`stats-bans`);
					break;
				case PunishmentType.Timeout:
					await redis.incr(`stats-timeouts`);
					break;
				case PunishmentType.Softban:
					await redis.incr(`stats-softbans`);
					break;
				case PunishmentType.Kick:
					await redis.incr(`stats-kicks`);
					break;
				case PunishmentType.Unban:
					await redis.incr(`stats-unbans`);
					break;
			}
		}

		const mod = await guild.members.fetch(data.moderator).catch(e => void Sentry.captureException(e));

		const embed = await this.createPunishmentEmbed(guild, { caseID, ...data }, mod!, await guild.client.users.fetch(data.userID));

		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		const logChannel = await guild.channels.fetch((await SettingsManager.getSettings(data.guildID)).logChannelId ?? '0').catch(() => null) ?? guild.channels.cache.find(val => ["logs", "audit-logs", "server-logs", "sentry-logs", "guild-logs", "mod-logs", "modlogs"].includes(val.name));
		if (!logChannel || logChannel.type !== ChannelType.GuildText) return result instanceof Error ? Result.err(result) : Result.ok(embed);

		const log = await logChannel.send({ embeds: [embed] }).catch(e => void Sentry.captureException(e));
		!(result instanceof Error) && Sentry.captureException(result) && log && await prisma.punishment.update({ where: { id: result.id }, data: { modLogID: log.id, modLogChannelID: logChannel.id } });
		return result instanceof Error ? Result.err(result) : Result.ok(embed);
	},
	createPunishmentEmbed: async function(guild: Guild, data: Omit<Punishment, 'id' | 'createdAt' | 'modLogID' | 'modLogChannelID'>, moderator: GuildMember, user: User): Promise<EmbedBuilder> {
		let color = 0x000000;

		switch (data.type) {
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
			default:
				color = 0x202225;
				break;
		}

		const mod = await guild.members.fetch(moderator).catch(e => void Sentry.captureException(e));

		const arr = [`<:point:995372986179780758> **Member:** ${user.tag} (${user.id})`, `<:point:995372986179780758> **Action:** ${data.type} ${data.type === PunishmentType.Timeout && data.expires ? `(<t:${Math.round(data.expires.getTime() / 1000)}:R>)` : ""}`, `<:point:995372986179780758> **Reason:** ${data.reason.substring(0, 900)}`];

		if (data.reference !== null) {
			const ref = await this.fetchPunishment(data.reference, data.guildID);

			if (ref.isOkAnd(val => val.modLogID !== null && val.modLogChannelID !== null)) arr.push(`<:point:995372986179780758> **Reference:** [#${ref.unwrap().caseID}](https://discord.com/channels/${ref.unwrap().guildID}/${ref.unwrap().modLogChannelID!}/${ref.unwrap().modLogID!})`);
		}

		return new EmbedBuilder()
			.setAuthor({ iconURL: mod ? mod.user.displayAvatarURL() : guild.client.user!.displayAvatarURL(), name: `${mod ? mod.user.tag : guild.client.user!.tag} (${mod ? mod.user.id : guild.client.user!.id})` })
			.setTimestamp()
			.setColor(color)
			// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
			.setDescription(arr.join("\n"))
			.setFooter({ text: `Case #${data.caseID}` });
	},
	fetchPunishmentId: async function(guildId: Snowflake): Promise<number> {
		const caseNumber = parseInt(await redis.get(`${guildId}-caseNo`) ?? '-1', 10) + 1;
		await redis.set(`${guildId}-caseNo`, caseNumber);

		return caseNumber;
	},
	fetchUserPunishments: async function(userId: Snowflake, guildId: Snowflake): Promise<Punishment[]> {
		await prisma.user.upsert({ create: { id: userId }, update: {}, where: { id: userId } });

		return (await prisma.user.findUnique({ where: { id: userId }, include: { punishments: true } }))?.punishments.filter(punishment => punishment.guildID === guildId) ?? [];
	},
	fetchGuildPunishments: async function(guildId: Snowflake): Promise<Punishment[]> {
		await prisma.guild.upsert({ create: { id: guildId }, update: {}, where: { id: guildId } });

		return (await prisma.guild.findUnique({ where: { id: guildId }, include: { punishments: true } }))?.punishments ?? [];
	},
	fetchPunishment: async function(caseID: number, guildID: Snowflake): Promise<Result<Punishment, Error>> {
		const punishments = await this.fetchGuildPunishments(guildID).catch(e => void Sentry.captureException(e));

		if (!punishments) return Result.err(new Error("No Cases Found"));

		let start = 0;
		let end = punishments.length - 1;

		let punishment: Punishment | null = null;

		while (start <= end) {
			const mid = Math.floor((start + end) / 2);

			if (punishments[mid].caseID === caseID) {
				punishment = punishments[mid];
				break;
			}

			if (caseID < punishments[mid].caseID) end = mid - 1;
			else start = mid + 1;
		}

		if (punishment !== null) return Result.ok(punishment);

		return Result.err(new Error("no punishment found"));
	},
	canPunish: async function(client: Client, type: PunishmentType, user: Snowflake, punisher: Snowflake, guildId: Snowflake): Promise<boolean> {
		const moderator = await (await client.guilds.fetch(guildId)).members.fetch(punisher);
		const me = (await client.guilds.fetch(guildId)).members.me;

		if (type === PunishmentType.Unban) {
			const ban = await (await client.guilds.fetch(guildId)).bans.fetch(user).catch(e => void Sentry.captureException(e));
			if (!ban) return false;
			if (!moderator.permissions.has(PermissionsBitField.Flags.BanMembers, true)) return false;
			if (!me?.permissions.has(PermissionsBitField.Flags.BanMembers, true)) return false;

			return true;
		}

		const member = await (await client.guilds.fetch(guildId)).members.fetch(user);

		if (member.user.bot || (await client.guilds.fetch(guildId)).ownerId === member.id || member.id === moderator.id) return false;

		if (member.permissions.has(PermissionsBitField.Flags.Administrator, true)) return false;

		if (([PunishmentType.Ban, PunishmentType.Softban] as PunishmentType[]).includes(type)) {
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
	createPunishmentPrompt: async function(user: User, guildId: Snowflake): Promise<[EmbedBuilder, ActionRowBuilder<ButtonBuilder>]> {
		const punishments = await this.fetchUserPunishments(user.id, guildId);

		return [new EmbedBuilder()
			.setAuthor({ iconURL: user.displayAvatarURL(), name: `${user.tag} (${user.id})` })
			.setTimestamp()
			.setColor(0xF79454)
			.setTitle(`Are you sure you want to punish ${user.tag}`)
			.setDescription([`<:point:995372986179780758> **${punishments.filter(punishment => punishment.type === PunishmentType.Ban).length}** Ban${punishments.filter(punishment => punishment.type === PunishmentType.Ban).length === 1 ? '' : 's'}`, `**${punishments.filter(punishment => punishment.type === PunishmentType.Softban).length}** Softban${punishments.filter(punishment => punishment.type === PunishmentType.Softban).length === 1 ? '' : 's'}`, `**${punishments.filter(punishment => punishment.type === PunishmentType.Kick).length}** Kick${punishments.filter(punishment => punishment.type === PunishmentType.Kick).length === 1 ? '' : 's'}`, `**${punishments.filter(punishment => punishment.type === PunishmentType.Timeout).length}** Timeout${punishments.filter(punishment => punishment.type === PunishmentType.Timeout).length === 1 ? '' : 's'}`, `**${punishments.filter(punishment => punishment.type === PunishmentType.Warn).length}** Warn${punishments.filter(punishment => punishment.type === PunishmentType.Warn).length === 1 ? '' : 's'}`].join('\n <:point:995372986179780758> ')), new ActionRowBuilder<ButtonBuilder>().addComponents(...[new ButtonBuilder().setCustomId(`ignore-${nanoid()}-punishment-prompt-accept`).setEmoji('🔨')
			.setStyle(ButtonStyle.Primary)
			.setLabel('Punish'), new ButtonBuilder().setCustomId(`ignore-${nanoid()}-punishment-prompt-decline`).setEmoji('❌')
			.setStyle(ButtonStyle.Secondary)
			.setLabel('Cancel')])];
	},
	handleUser2FA: async function(interaction: ChatInputCommandInteraction | ContextMenuCommandInteraction, userId: Snowflake): Promise<[boolean, ModalSubmitInteraction | null]> {
		const user = await SettingsManager.getUserSettings(userId);

		if (!user.secret) {
			if (interaction.guild?.mfaLevel === GuildMFALevel.Elevated || (await SettingsManager.getSettings(interaction.guildId!)).enforce2fa) {
				const embed = new EmbedBuilder()
					.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
					.setTimestamp()
					.setColor(0xFF5C5C)
					.setDescription("<:point:995372986179780758> This guild requires 2FA for moderation access, please setup 2FA to run this command.\n\n> Dont want this enabled? Modify it with /settings, and make sure 2FA requirement for moderation is disabled in Server Settings > Safety Setup")
					.setTitle("Please Enable 2FA");

				await InteractionManager.sendInteractionResponse(interaction, { ephemeral: true, embeds: [embed], components: [], files: [] }, ResponseType.Reply);

				return [false, null];
			}

			return [true, null];
		}

		const customId = `ignore-${nanoid()}-modal`;
		const textId = `${nanoid()}-text`;

		await interaction.showModal(new ModalBuilder().setTitle('Verify Identity').setCustomId(customId)
			.addComponents(...[new ActionRowBuilder<TextInputBuilder>().addComponents(...[new TextInputBuilder().setCustomId(textId).setLabel('2FA Code')
				.setMinLength(6)
				.setRequired(true)
				.setStyle(TextInputStyle.Short)])]));

		const response = await interaction.awaitModalSubmit({ time: 120000, filter: i => i.customId === customId && i.user.id === interaction.user.id }).catch(async () => {
			const embed = new EmbedBuilder()
				.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
				.setTimestamp()
				.setColor(0xFF5C5C)
				.setDescription("<:point:995372986179780758> Make sure the code hasn't expired!")
				.setTitle(`Failed to Verify 2FA Token`);

			return void await InteractionManager.sendInteractionResponse(interaction, { ephemeral: true, embeds: [embed], components: [], files: [] }, ResponseType.Reply);
		});

		if (!response) return [false, null];

		try {
			if (!speakeasy.totp.verify({ secret: user.secret, token: response.fields.getTextInputValue(textId), digits: response.fields.getTextInputValue(textId).length, encoding: "base32" })) {
				const embed = new EmbedBuilder()
					.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
					.setTimestamp()
					.setColor(0xFF5C5C)
					.setDescription("<:point:995372986179780758> Make sure the code hasn't expired!")
					.setTitle(`Failed to Verify 2FA Token`);

				await InteractionManager.sendInteractionResponse(response, { ephemeral: true, embeds: [embed], components: [], files: [] }, ResponseType.Reply);

				return [false, null];
			}
		} catch {
			const embed = new EmbedBuilder()
				.setAuthor({ iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.tag} (${interaction.user.id})` })
				.setTimestamp()
				.setColor(0xFF5C5C)
				.setDescription("<:point:995372986179780758> Make sure the code hasn't expired!")
				.setTitle(`Failed to Verify 2FA Token`);

			await InteractionManager.sendInteractionResponse(response, { ephemeral: true, embeds: [embed], components: [], files: [] }, ResponseType.Reply);
			return [false, null];
		}

		return [true, response];
	}
};
