import { PunishmentType, Punishment as PunishmentModel } from "database";
import { APIButtonComponent, APIChannel, APIDMChannel, APIEmbed, APIGroupDMChannel, APIMessage, APIThreadChannel, APIUser, ButtonStyle, CDNRoutes, ChannelType, ComponentType, ImageFormat, Routes, Snowflake } from "discord-api-types/v10";
import { Prisma, Redis } from "../db.js";
import { REST } from "../index.js";
import { logger } from "../config.js"

// TODO: Custom Audit Log Channel Finding
export class Punishment<T extends PunishmentType> {
	public type: T;
	private data: Omit<PunishmentModel, 'id' | 'createdAt' | 'updatedAt' | 'modLogId'>;
	private expiration?: Date

	public constructor(data: { type: T, expiration?: Date } & Omit<PunishmentModel, 'id' | 'caseId' | 'createdAt' | 'updatedAt' | 'modLogId'>) {
		this.type = data.type as T;
	
		if("expiration" in data && this.type === PunishmentType.Timeout) this.expiration = data.expiration

		this.data = { ...data, caseId: -1 };
	}

	public static async fetch(data: { id: number } | { guildId: Snowflake, caseId: number }) {
		const punishment = await Prisma.punishment.findFirst({ where: data });

		return punishment;
	}

	private static async getCaseId(guildId: Snowflake) {
		if(!(await Redis.hexists(`case_numbers`, guildId))) await Redis.hset(`case_numbers`, guildId, 0)
		return parseInt((await Redis.hget(`case_numbers`, guildId) ?? '0')) + 1
	}

	private async createAuditLogMessage() {
		const channels = await REST.get(Routes.guildChannels(this.data.guildId)) as Exclude<APIChannel, APIThreadChannel | APIGroupDMChannel | APIDMChannel>[];

		const channel = channels.filter((channel) => channel.type === ChannelType.GuildText && channel.name && ['audit-logs', 'sentry-logs', 'server-logs', 'logs', 'mod-logs', 'modlog', 'modlogs', 'auditlogs', 'auditlog'].includes(channel.name)).at(0);
		if(!channel) return;

		const member = await REST.get(Routes.user(this.data.userId)) as APIUser | undefined;
		const moderator = await REST.get(Routes.user(this.data.moderatorId)) as APIUser | undefined;

		if(!member || !moderator) return;

		const description: Array<[string, string] | string> = [["Member", `\`${member.username}#${member.discriminator}\` (${member.id})`], ['Action', this.type], ['Reason', this.data.reason]]
		const components: APIButtonComponent[] = [{ type: 2, style: ButtonStyle.Primary, label: `Case #${this.data.caseId}`, custom_id: `case_${this.data.caseId}`, disabled: true }]

		if(this.expiration && this.type === 'Timeout') description.push(['Expiration', `<t:${Math.round(this.expiration.getTime() / 1000)}:R>`])
		if(this.data.references) {
			const referenced = await Punishment.fetch({ guildId: this.data.guildId, caseId: this.data.references })

			if(!referenced) return;

			if(referenced.modLogId) {
				description.push(['Case Reference', `[#${referenced.caseId}](https://discord.com/channels/${this.data.guildId}/${channel.id}/${referenced.modLogId})`])
				components.push({ type: 2, style: ButtonStyle.Link, label: `Open Case Reference`, url: `https://discord.com/channels/${this.data.guildId}/${channel.id}/${referenced.modLogId}` })
			} else {
				description.push(['Case Reference', `${referenced.caseId}`])
			}
		}

		description.forEach((val, i) => description[i] = `**${val[0]}**: ${val[1]}`);

		let color: number = 0x171d2e
		if(this.type === 'Ban') color = 0xff5c5c
		else if(this.type == 'Kick') color = 0xf79554
		else if(this.type == 'Softban') color = 0xf77f54
		else if(this.type == 'Warn') color = 0xffdc5c
		else if(this.type == 'Timeout') color = 0x1d1d21
		else if(this.type == 'Unban') color = 0x5cff9d

		const embed: APIEmbed = {
			description: description.join('\n'),
			color,
			author: {
				name: `${moderator.username}#${moderator.discriminator} (${moderator.id})`,
				icon_url: moderator.avatar ? `https://cdn.discordapp.com${CDNRoutes.userAvatar(moderator.id, moderator.avatar, ImageFormat.WebP)}` : "https://cdn.discordapp.com/embed/avatars/0.png"
			}
		}

		const row: { type: ComponentType.ActionRow, components: APIButtonComponent[] } = { type: 1, components }

		return await REST.post(Routes.channelMessages(channel.id), { body: { embeds: [embed], components: [row] }}) as APIMessage
	}

	public async run(): Promise<PunishmentModel | Error> {
		this.data.caseId = await Punishment.getCaseId(this.data.guildId)

		await Prisma.user.upsert({ create: { id: this.data.userId }, update: {}, where: { id: this.data.userId }});
		await Prisma.guild.upsert({ create: { id: this.data.guildId }, update: {}, where: { id: this.data.guildId }});

		try {
			switch(this.type) {
				case PunishmentType.Ban:
					await REST.put(Routes.guildBan(this.data.guildId, this.data.userId), { reason: this.data.reason, body: { delete_message_seconds: 604800 } });
					break
				case PunishmentType.Softban:
					await REST.put(Routes.guildBan(this.data.guildId, this.data.userId), { reason: this.data.reason, body: { delete_message_seconds: 604800 } });
					await REST.delete(Routes.guildBan(this.data.guildId, this.data.userId), { reason: "Removing Softban" });
					break
				case PunishmentType.Kick:
					await REST.delete(Routes.guildMember(this.data.guildId, this.data.userId), { reason: this.data.reason });
					break
				case PunishmentType.Timeout:
					if(!this.expiration) throw new Error("No Expiration Provided")
					await REST.patch(Routes.guildMember(this.data.guildId, this.data.userId), { reason: this.data.reason, body: { communication_disabled_until: this.expiration.toISOString() }});
					break
				case PunishmentType.Unban:
					break
				case PunishmentType.Warn:
					break
			}
		} catch(err) {
			logger.error(err);
			return err as Error;
		}

		await Redis.hincrby(`case_numbers`, this.data.guildId, 1)

		const modLog = await this.createAuditLogMessage();

		if("expiration" in this.data) delete this.data.expiration

		const data = await Prisma.punishment.create({ data: { ...this.data, modLogId: modLog?.id } })

		return data
	}
}