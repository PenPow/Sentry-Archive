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

	protected async getCaseId(guildId: Snowflake) {
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

	protected async createAuditLogMessage(id: number, guildId: Snowflake) {
		const guildDatabase = await Prisma.guild.findUnique({ where: { id: guildId }});

		if(guildDatabase?.modLogChannelId) {
			const channel = await api.channels.get(guildDatabase.modLogChannelId).catch(() => undefined);

			if(channel) {
				const data = await this.createEmbed(id, channel.id);
				const msg = await api.channels.createMessage(channel.id, { components: [data[1]], embeds: [data[0]] }).catch(() => undefined);

				if(msg) await Prisma.punishment.update({ where: { id }, data: { modLogId: msg.id }});
			}
		} else {
			const channels = await api.guilds.getChannels(guildId);
			const channel = channels.filter((chnl) => chnl.type === ChannelType.GuildText && ["audit-logs", "sentry-logs", "server-logs", "mod-logs", "audit-log", "auditlogs", "auditlog", "logs"].includes(chnl?.name ?? "")).at(0);

			if(!channel) return;

			const data = await this.createEmbed(id, channel.id);
			const msg = await api.channels.createMessage(channel.id, { components: [data[1]], embeds: [data[0]] }).catch(() => undefined);

			if(msg) await Prisma.punishment.update({ where: { id }, data: { modLogId: msg.id }});
		}
	}

	private async createEmbed(id: number, channel: Snowflake): Promise<[APIEmbed, APIActionRowComponent<APIMessageActionRowComponent>]> {
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

	private selectColor(type: PunishmentType): number {
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
	public async build(): Promise<null | void> {
		await Punishment.createUserAndGuild(this.data.userId, this.data.guildId);

		const caseId = await this.getCaseId(this.data.guildId);

		const member = await api.guilds.getMember(this.data.guildId, this.data.userId);
		const guild = await api.guilds.get(this.data.guildId);
		if(["Ban", "Softban"].includes(this.data.type) && !(await PermissionsManager.canBanUser(member, guild)) || this.data.type === "Kick" && !(await PermissionsManager.canKickUser(member, guild))) return;

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
		} catch {
			return null;
		}

		const { id } = await Prisma.punishment.create({ data: { ...this.data, caseId, type: this.data.type }});
		await this.createAuditLogMessage(id, this.data.guildId);
	}
}

// TODO: Implement Other Time Based Punishments
export class ExpiringPunishment extends Punishment {
	public readonly data: Pick<PunishmentModel, "guildId" | "moderatorId" | "reason" | "references" | "userId"> & { expires: Date };

	// eslint-disable-next-line sonarjs/no-identical-functions
	public constructor(data: Pick<PunishmentModel, "guildId" | "moderatorId" | "reason" | "references" | "userId"> & { expires: Date }) {
		super();

		this.data = data;
	}

	// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
	public async build(): Promise<null | void> {
		await Punishment.createUserAndGuild(this.data.userId, this.data.guildId);

		const member = await api.guilds.getMember(this.data.guildId, this.data.userId);
		const guild = await api.guilds.get(this.data.guildId);
		if(!(await PermissionsManager.canModerateUser(member, guild))) return;

		try {
			await api.guilds.editMember(this.data.guildId, this.data.userId, { communication_disabled_until: this.data.expires.toISOString() }, this.data.reason);
		} catch {
			return null;
		}

		const caseId = await this.getCaseId(this.data.guildId);

		const { id } = await Prisma.punishment.create({ data: { ...this.data, caseId, type: "Timeout" }});
		await this.createAuditLogMessage(id, this.data.guildId);
	}
}