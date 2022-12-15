import type { Snowflake } from "discord-api-types/v10";
import { nanoid } from 'nanoid';
import { generateSecret, verifyToken } from "node-2fa";
import { Prisma } from "../db.js";

/**
 * Handle generation and modification of a users two factor authentication codes
 * 
 * @public
 */
export class TwoFactorAuthenticationManager {
	public static async createUser2FA(id: Snowflake): Promise<{ backup: string; secret: string; }> {
		await this.createUserObject(id);

		const { secret } = generateSecret();

		const backupCode = nanoid(15);

		await Prisma.user.update({
			where: { id },
			data: { 
				twofactor_secret: secret,
				backup_code: backupCode
			}
		});

		return { secret, backup: backupCode };
	}

	public static async removeUser2FA(id: Snowflake): Promise<void> {
		await this.createUserObject(id);

		await Prisma.user.update({ where: { id }, data: { twofactor_secret: null, backup_code: null }});
	}

	public static async verifyUser2FA(id: Snowflake, token: string, backup_allowed = false): Promise<boolean> {
		const { twofactor_secret: secret, backup_code: backup } = await this.createUserObject(id);

		if(!secret) return true; // 2FA is not configured

		if(backup_allowed && token === backup) return true;

		return verifyToken(secret, token)?.delta === 0 || false;
	}

	public static async has2FAEnabled(id: Snowflake): Promise<boolean> { // TODO: Create setting to enforce 2FA for mod commands in server
		return Boolean((await this.createUserObject(id)).twofactor_secret);
	}

	private static async createUserObject(id: Snowflake) {
		return Prisma.user.upsert({
			create: { id },
			update: {},
			where: { id },
		});
	}
}