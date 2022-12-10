import { Buffer } from "node:buffer";
import {
    type APIGuild,
    type APIGuildMember,
    type APIRole,
	PermissionFlagsBits,
	type RESTGetAPIGuildRolesResult
} from "discord-api-types/v10";
import { PermissionsBitField } from "discord.js";
import { api } from "../REST.js";
import { config } from "../config.js";

export class PermissionsManager {
	// role comparison stuff adapted from https://github.com/discordjs/discord.js/blob/main/packages/discord.js/src/structures/GuildMember.js
	private static compareRolePositions(role1: APIRole, role2: APIRole): number {
		if(role1.position === role2.position) return Number(BigInt(role2.id) - BigInt(role1.id));
		return role1.position - role2.position;
	}

	private static async canManageUser(member: APIGuildMember, guild: APIGuild, me: APIGuildMember, roles: RESTGetAPIGuildRolesResult): Promise<boolean> {
		if(!member.user) return false;
		if(member.user.id === guild.owner_id) return false;

		const clientId = Buffer.from(config.discord.TOKEN.split(".")[0]!, "base64").toString();
		if(member.user.id === clientId) return false;
		if(clientId === guild.owner_id) return true;

		const sentryHighest = me.roles.map((val) => roles.find((role) => role.id === val)).filter((val) => val !== undefined).reduce((previous, current) => this.compareRolePositions(current!, previous!) > 0 ? current : previous);
		if(!sentryHighest) return false;

		const memberHighest = member.roles.map((val) => roles.find((role) => role.id === val)).filter((val) => val !== undefined).reduce((previous, current) => this.compareRolePositions(current!, previous!) > 0 ? current : previous);
		if(!memberHighest) return false;

		const rolePositions = this.compareRolePositions(sentryHighest, memberHighest);
		return rolePositions > 0;
	}

	private static async getUserPermissions(member: APIGuildMember, guild: APIGuild, roles: RESTGetAPIGuildRolesResult) {
		if(member.user && member.user.id === guild.owner_id) return new PermissionsBitField(PermissionsBitField.All).freeze();

		return new PermissionsBitField(member.roles.map((val) => roles.find((role) => role.id === val)).filter((val) => val !== undefined).map((role) => role?.permissions) as any[]).freeze();
	}

	public static async canBanUser(member: APIGuildMember, guild: APIGuild, moderator = Buffer.from(config.discord.TOKEN.split(".")[0]!, "base64").toString()): Promise<boolean> {
		const clientId = Buffer.from(config.discord.TOKEN.split(".")[0]!, "base64").toString();
		const me = await api.guilds.getMember(guild.id, clientId);

		const roles = await api.guilds.getRoles(guild.id);

		const moderatorObject = clientId === moderator ? me : await api.guilds.getMember(guild.id, moderator);

		return await this.canManageUser(member, guild, me, roles) && (await this.getUserPermissions(moderatorObject, guild, roles)).has(PermissionFlagsBits.BanMembers) && (await this.getUserPermissions(me, guild, roles)).has(PermissionFlagsBits.BanMembers);
	}

	public static async canKickUser(member: APIGuildMember, guild: APIGuild, moderator = Buffer.from(config.discord.TOKEN.split(".")[0]!, "base64").toString()): Promise<boolean> {
		const clientId = Buffer.from(config.discord.TOKEN.split(".")[0]!, "base64").toString();
		const me = await api.guilds.getMember(guild.id, clientId);

		const roles = await api.guilds.getRoles(guild.id);

		const moderatorObject = clientId === moderator ? me : await api.guilds.getMember(guild.id, moderator);

		return await this.canManageUser(member, guild, me, roles) && (await this.getUserPermissions(moderatorObject, guild, roles)).has(PermissionFlagsBits.KickMembers) && (await this.getUserPermissions(me, guild, roles)).has(PermissionFlagsBits.KickMembers);
	}

	public static async canModerateUser(member: APIGuildMember, guild: APIGuild, moderator = Buffer.from(config.discord.TOKEN.split(".")[0]!, "base64").toString()): Promise<boolean> {
		const clientId = Buffer.from(config.discord.TOKEN.split(".")[0]!, "base64").toString();
		const me = await api.guilds.getMember(guild.id, clientId);

		const roles = await api.guilds.getRoles(guild.id);

		const moderatorObject = clientId === moderator ? me : await api.guilds.getMember(guild.id, moderator);

		return !(await this.getUserPermissions(member, guild, roles)).has(PermissionFlagsBits.Administrator) && await this.canManageUser(member, guild, me, roles) && ((await this.getUserPermissions(moderatorObject, guild, roles)).has(PermissionFlagsBits.ModerateMembers) ?? false) && (await this.getUserPermissions(me, guild, roles)).has(PermissionFlagsBits.KickMembers);;
	}
}