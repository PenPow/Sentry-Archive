import { PunishmentType, Punishment as PunishmentModel } from "@prisma/client";
import { Routes, Snowflake } from "discord-api-types/v10";
import { Prisma, Redis } from "../db.js";
import { REST } from "../index.js";

// TODO: Custom Audit Logs
export class Punishment<T extends PunishmentType> {
	public type: T;
	private data: Omit<PunishmentModel, 'id' | 'createdAt' | 'updatedAt'>;
	private expiration?: Date

	public constructor(data: { type: T, expiration?: Date } & Omit<PunishmentModel, 'id' | 'caseId' | 'createdAt' | 'updatedAt'>) {
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
				case PunishmentType.Warn:
					break
			}
		} catch(err) {
			return err as Error;
		}

		await Redis.hincrby(`case_numbers`, this.data.guildId, 1)

		if("expiration" in this.data) delete this.data.expiration

		return await Prisma.punishment.create({ data: this.data })
	}
}