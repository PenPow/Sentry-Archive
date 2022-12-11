import { Result } from "@sapphire/result";
import type { PunishmentType, Punishment as PunishmentModel } from "database";
import {
  type APIActionRowComponent,
  type APIButtonComponent,
  type APIEmbed,
  type APIMessageActionRowComponent,
  type Snowflake,
  ComponentType,
  ButtonStyle,
  CDNRoutes,
  ChannelType,
  ImageFormat,
  Routes,
  type APIMessage,
  type APIChannel,
  type RESTGetAPIGuildChannelsResult,
} from "discord-api-types/v10";
import { api } from "../REST.js";
import { Prisma, Redis } from "../db.js";
import { PermissionsManager } from "../utils/PermissionsHelpers.js";

abstract class Punishment {
	public static async fetch(data: { caseId: number, guildId: Snowflake } | { id: number }) {
		return Prisma.punishment.findFirst({ where: data });
	}

	public static async fetchUserPunishments(userId: Snowflake, guildId: Snowflake): Promise<(ExpiringPunishment | GenericPunishment)[]> {
		await this.createUserAndGuild(userId, guildId);

		const user = await Prisma.user.findUnique({ where: { id: userId }, select: { punishments: true }});
		if(!user) return [];

		// @ts-expect-error this works and im too lazy to fix the type error
		// eslint-disable-next-line @typescript-eslint/no-use-before-define
		return user.punishments.filter((punishment) => punishment.guildId === guildId).map((punishment) => punishment.type === "Timeout" ? new ExpiringPunishment(punishment) : new GenericPunishment(punishment));
	}

	public static async getCaseId(guildId: Snowflake) {
		const caseNoHashExists = await Redis.hexists("case_numbers", guildId);

		if(!caseNoHashExists) {
			await Redis.hset("case_numbers", guildId, 1);

			return 1;
		}
		
		const caseNo = await Redis.hget('case_numbers', guildId);
		if(!caseNo) return 1;

		await Redis.hincrby("case_numbers", guildId, 1);

		return Number.parseInt(caseNo, 10) + 1;
	}

	public static async createAuditLogMessage(id: number, guildId: Snowflake): Promise<Result<APIMessage, Error>> {
		const guildDatabase = await Prisma.guild.findUnique({ where: { id: guildId }});

		if(guildDatabase?.modLogChannelId) {
			const channel: Result<APIChannel, Error> = await Result.fromAsync(async () => api.channels.get(guildDatabase.modLogChannelId!));

			if(channel.isOk()) {
				const data = await this.createEmbed(id, channel.unwrap().id);
				const msg: Result<APIMessage, Error> = await Result.fromAsync(async () => api.channels.createMessage(channel.unwrap().id, { components: [data[1]], embeds: [data[0]] }));

				if(msg.isOk()) await Prisma.punishment.update({ where: { id }, data: { modLogId: msg.unwrap().id }});

				return msg;
			} else return channel;
		} else {
			const channels: Result<RESTGetAPIGuildChannelsResult, Error> = await Result.fromAsync(async () => api.guilds.getChannels(guildId));
			if(channels.isErr()) return channels;

			const channel = channels.unwrap().filter((chnl) => chnl.type === ChannelType.GuildText && ["audit-logs", "sentry-logs", "server-logs", "mod-logs", "audit-log", "auditlogs", "auditlog", "logs"].includes(chnl?.name ?? "")).at(0);

			if(!channel) return Result.err(new Error("No Channel Found"));

			const data = await this.createEmbed(id, channel.id);
			const msg: Result<APIMessage, Error> = await Result.fromAsync(async () => api.channels.createMessage(channel.id, { components: [data[1]], embeds: [data[0]] }));

			if(msg.isOk()) await Prisma.punishment.update({ where: { id }, data: { modLogId: msg.unwrap().id }});

			return msg;
		}
	}

	private static async createEmbed(id: number, channel: Snowflake): Promise<[APIEmbed, APIActionRowComponent<APIMessageActionRowComponent>]> {
		const modCase = await Punishment.fetch({ id });
		if(!modCase) throw new Error("No Case Found");

		const { userId, caseId, moderatorId, reason, references, createdAt, type, expires, guildId } = modCase;

		const member = await api.users.get(userId);
		const moderator = await api.users.get(moderatorId);

		const description: [string, string][] = [
			["Member", `<@${member.id}> (${member.id})` ],
			["Moderator", `<@${moderator.id}> (${moderator.id})`, ],
			["Action", type],
			["Reason", reason],
		];

		const components: APIButtonComponent[] = [{
			type: ComponentType.Button,
			style: ButtonStyle.Primary,
			label: `Case #${caseId}`,
			custom_id: "case_button_placeholder",
			disabled: true
		}];

		if(expires) description.push(["Expiration", `<t:${Math.round(expires.getTime() / 1_000)}:R>`]);
		if(references) {
			const referencesCase = await Punishment.fetch({ caseId: references, guildId });

			if(referencesCase) {
				if(referencesCase.modLogId) {
					components.push({ type: ComponentType.Button, style: ButtonStyle.Link, label: 'Open Case Reference', url: `https://discord.com/channels/${guildId}/${channel}/${referencesCase.modLogId})` });
					description.push(["Reference", `[#${referencesCase.caseId}](https://discord.com/channels/${guildId}/${channel}/${referencesCase.modLogId})`]);
				} else {
					description.push(["Reference", `#${referencesCase.caseId}`]);
				}
			}
		}
		
		return [
			{
				description: description.map((val) => `**${val[0]}**: ${val[1]}`).join('\n'),
				color: this.selectColor(type),
				author: {
					name: `${moderator.username}#${moderator.discriminator} (${moderator.id})`,
					icon_url: moderator.avatar ? `https://cdn.discordapp.com${CDNRoutes.userAvatar(moderator.id, moderator.avatar, ImageFormat.WebP)}` : "https://cdn.discordapp.com/embed/avatars/0.png"
				},
				timestamp: createdAt.toISOString()
			}, 
			{ 
				components, 
				type: ComponentType.ActionRow
			}
		];
	}

	private static selectColor(type: PunishmentType): number {
		switch(type) {
			case "Ban":
				return 0xFF5C5C;
			case "Kick":
				return 0xF79554;
			case "Softban":
				return 0xF77F54;
			case "Timeout":
				return 0x1D1D21;
			case "Unban":
				return 0x5CFF9D;
			case "Warn":
				return 0xFFDC5C;
			default:
				return 0x171D2E;
		}
	}

	protected static async createUserAndGuild(userId: Snowflake, guildId: Snowflake): Promise<void> {
		await Prisma.user.upsert({
			create: { id: userId },
			update: {},
			where: { id: userId },
		});

		await Prisma.guild.upsert({
			create: { id: guildId },
			update: {},
			where: { id: guildId },
		});
	}

	public isGenericPunishment(): this is GenericPunishment {
		return !("expires" in (this as unknown as ExpiringPunishment | GenericPunishment).data);
	}
	
	public isExpringPunishment(): this is ExpiringPunishment {
		return "expires" in (this as unknown as ExpiringPunishment | GenericPunishment).data;
	}
}

export class GenericPunishment extends Punishment {
	public readonly data: Pick<PunishmentModel, "guildId" | "moderatorId" | "reason" | "references" | "userId">  & { type: "Ban" | "Kick" | "Softban" | "Unban" | "Warn" };

	public constructor(data: Pick<PunishmentModel, "guildId" | "moderatorId" | "reason" | "references" | "userId"> & { type: "Ban" | "Kick" | "Softban" | "Unban" | "Warn" }) {
		super();

		this.data = data;
	}

	// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
	public async build(): Promise<Result<APIMessage, Error>> {
		await Punishment.createUserAndGuild(this.data.userId, this.data.guildId);

		const caseId = await Punishment.getCaseId(this.data.guildId);

		const member = await api.guilds.getMember(this.data.guildId, this.data.userId);
		const guild = await api.guilds.get(this.data.guildId);

		if(['Ban', 'Softban'].includes(this.data.type) && !(await PermissionsManager.canBanUser(member, guild, this.data.moderatorId))) return Result.err(new Error("Cannot Ban User"));
		else if(this.data.type === "Kick" && !(await PermissionsManager.canKickUser(member, guild, this.data.moderatorId))) return Result.err(new Error("Cannot Kick User"));
		try {
			switch(this.data.type) {
				case "Ban":
					await api.guilds.banUser(this.data.guildId, this.data.userId, { delete_message_seconds: 604_800 }, this.data.reason);
					break;
				case "Kick":
					await api.rest.delete(Routes.guildMember(this.data.guildId, this.data.userId), { reason: this.data.reason });
					break;
				case "Softban":
					await api.guilds.banUser(this.data.guildId, this.data.userId, { delete_message_seconds: 604_800 }, this.data.reason);
					await api.guilds.unbanUser(this.data.guildId, this.data.userId, `Case #${caseId} - Removing Softban`);
					break;
				case "Unban":
					await api.guilds.unbanUser(this.data.guildId, this.data.userId, this.data.reason);
					break;
				case "Warn":
					break;
			}
		} catch (error) {
			return Result.err(error as Error);
		}

		const { id } = await Prisma.punishment.create({ data: { ...this.data, caseId, type: this.data.type }});
		return Punishment.createAuditLogMessage(id, this.data.guildId);
	}
}

// TODO: Implement Other Time Based Punishments
export class ExpiringPunishment extends Punishment {
	public readonly data: Pick<PunishmentModel, "guildId" | "moderatorId" | "reason" | "references" | "userId"> & { expires: Date, type: "Ban" | "Timeout" };

	// eslint-disable-next-line sonarjs/no-identical-functions
	public constructor(data: Pick<PunishmentModel, "guildId" | "moderatorId" | "reason" | "references" | "userId"> & { expires: Date, type: "Ban" | "Timeout" }) {
		super();

		this.data = data;
	}

	// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
	public async build(): Promise<Result<APIMessage, Error>> {
		await Punishment.createUserAndGuild(this.data.userId, this.data.guildId);

		const member = await api.guilds.getMember(this.data.guildId, this.data.userId);
		const guild = await api.guilds.get(this.data.guildId);
		if(this.data.type === "Timeout" && !(await PermissionsManager.canModerateUser(member, guild, this.data.moderatorId))) return Result.err(new Error("Cannot Moderate User"));
		if(this.data.type === "Ban" && !(await PermissionsManager.canBanUser(member, guild, this.data.moderatorId))) return Result.err(new Error("Cannot Ban User"));

		try {
			if(this.data.type === "Timeout") await api.guilds.editMember(this.data.guildId, this.data.userId, { communication_disabled_until: this.data.expires.toISOString() }, this.data.reason);
			else if(this.data.type === "Ban") await api.guilds.banUser(this.data.guildId, this.data.userId, { delete_message_seconds: 604_800 }, this.data.reason);
		} catch(error) {
			return Result.err(error as Error);
		}

		const caseId = await Punishment.getCaseId(this.data.guildId);

		const { id } = await Prisma.punishment.create({ data: { ...this.data, caseId }});
		if(this.data.type === "Ban") {
			await Redis.set(`punishment_${id}`, "ok", "PXAT", this.data.expires.valueOf());
		}

		return Punishment.createAuditLogMessage(id, this.data.guildId);
	}
}