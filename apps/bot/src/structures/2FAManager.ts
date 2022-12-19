import { type APIGuild, GuildMFALevel, type Snowflake } from "discord-api-types/v10";
import { nanoid } from 'nanoid';
import { generateSecret, verifyToken } from "node-2fa";
import { Prisma } from "../db.js";

/**
 * Handle generation and modification of a users two factor authentication codes
 * 
 * @public
 */
export class TwoFactorAuthenticationManager {
	/**
	 * Creates/updates the user's two factor settings. It will overwrite their current details.
	 * 
	 * @public
	 * @param id - The user's discord id
	 * @returns Their backup code, and their authenticator secret.
	 */
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

	/**
	 * Removes a user's two factor settings
	 * 
	 * @public
	 * @param id - The user's discord id
	 */
	public static async removeUser2FA(id: Snowflake): Promise<void> {
		await this.createUserObject(id);

		await Prisma.user.update({ where: { id }, data: { twofactor_secret: null, backup_code: null }});
	}

	/**
	 * Verify a users two factor authentication input
	 * 
	 * @public
	 * @param id - The user's discord id
	 * @param token - The token from their authenticator app
	 * @param backup_allowed - Whether their backup code is a valid form of authentication
	 * @returns Whether we could verify their code.
	 */
	public static async verifyUser2FA(id: Snowflake, token: string, backup_allowed = false): Promise<boolean> {
		const { twofactor_secret: secret, backup_code: backup } = await this.createUserObject(id);

		if(!secret) return true; // 2FA is not configured

		if(backup_allowed && token === backup) return true;

		return verifyToken(secret, token)?.delta === 0 || false;
	}

	/**
	 * Check if a user has 2FA enabled
	 * 
	 * @public
	 * @param id - The user's discord id
	 * @returns Whether they have it enabled
	 */
	public static async has2FAEnabled(id: Snowflake): Promise<boolean> {
		return Boolean((await this.createUserObject(id)).twofactor_secret);
	}

	/**
	 * Check if a user is required to have 2FA enabled, through the guild or through sentry settings
	 * 
	 * @public
	 * @param guild - The guild that they are in
	 * @returns Whether they need to have it enabled
	 */
	public static async doesUserRequire2FA(guild: APIGuild) {
		const guildEntry = await Prisma.guild.upsert({ where: { id: guild.id }, update: {}, create: { id: guild.id } });
		if(guildEntry.enforce2FA === true) return true;
		else if(guildEntry.enforce2FA === false) return false;

		return guild.mfa_level === GuildMFALevel.Elevated;
	}

	/**
	 * Create a user in prisma so that we have their object to work with
	 * 
	 * @internal
	 * @param id - The user's snowflake
	 */
	private static async createUserObject(id: Snowflake) {
		return Prisma.user.upsert({
			create: { id },
			update: {},
			where: { id },
		});
	}
}