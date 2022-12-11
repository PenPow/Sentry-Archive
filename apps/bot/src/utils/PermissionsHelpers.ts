import { Buffer } from "node:buffer";
import {
  type APIGuild,
  type APIGuildMember,
  type APIRole,
  PermissionFlagsBits,
  type RESTGetAPIGuildRolesResult,
} from "discord-api-types/v10";
import { PermissionsBitField } from "discord.js"; // TODO: Create own implementation of PermissionsBitField
import { api } from "../REST.js";
import { config } from "../config.js";

/**
 * Utility Class to handle moderation permissions
 *
 * @public
 */
export class PermissionsManager {
  /**
   * Private utility function to compare the positions of two roles
   *
   * @internal
   * @param role1 - First Role to Compare
   * @param role2 - Second Role to Compare
   * @returns number \> 0 if role1 is higher than role 2, or number \< 0 if role 2 is higher than role 1
   */
  private static compareRolePositions(role1: APIRole, role2: APIRole): number {
    // role comparison stuff adapted from https://github.com/discordjs/discord.js/blob/main/packages/discord.js/src/structures/GuildMember.js
    if (role1.position === role2.position)
      return Number(BigInt(role2.id) - BigInt(role1.id));
    return role1.position - role2.position;
  }

  /**
   * Private utility function to see if we can modify a user
   *
   * @internal
   * @param member - Member that we want to try and modify
   * @param guild - The guild that this member is a part of
   * @param me - Sentry's Guild Member
   * @param roles - All the roles in the guild
   * @returns A promise resolving to a boolean, representing whether we can modify the user
   */
  private static async canManageUser(
    member: APIGuildMember,
    guild: APIGuild,
    me: APIGuildMember,
    roles: RESTGetAPIGuildRolesResult
  ): Promise<boolean> {
    if (!member.user) return false;
    if (member.user.id === guild.owner_id) return false;

    const clientId = Buffer.from(
      config.discord.TOKEN.split(".")[0]!,
      "base64"
    ).toString();
    if (member.user.id === clientId) return false;
    if (clientId === guild.owner_id) return true;

    if (
      me.roles
        .map((val) => roles.find((role) => role.id === val))
        .filter((val) => val !== undefined).length === 0
    )
      return false;

    const sentryHighest = me.roles
      .map((val) => roles.find((role) => role.id === val))
      .filter((val) => val !== undefined)
      .reduce((previous, current) =>
        this.compareRolePositions(current!, previous!) > 0 ? current : previous
      );
    if (!sentryHighest) return false;

    if (
      member.roles
        .map((val) => roles.find((role) => role.id === val))
        .filter((val) => val !== undefined).length === 0
    )
      return true;
    const memberHighest = member.roles
      .map((val) => roles.find((role) => role.id === val))
      .filter((val) => val !== undefined)
      .reduce((previous, current) =>
        this.compareRolePositions(current!, previous!) > 0 ? current : previous
      );
    if (!memberHighest) return false;

    const rolePositions = this.compareRolePositions(
      sentryHighest,
      memberHighest
    );

    return rolePositions > 0;
  }

  /**
   * Private utility function to extract the permissions of a user based upon their roles
   *
   * @internal
   * @param member - Member to get permissions of
   * @param guild - Guild to get the  permissions in
   * @param roles - Roles in that guild
   * @returns A readonly bitfield of their permissions
   */
  private static async getUserPermissions(
    member: APIGuildMember,
    guild: APIGuild,
    roles: RESTGetAPIGuildRolesResult
  ) {
    if (member.user && member.user.id === guild.owner_id)
      return new PermissionsBitField(PermissionsBitField.All).freeze();

    return new PermissionsBitField(
      member.roles
        .map((val) => roles.find((role) => role.id === val))
        .filter((val) => val !== undefined)
        .map((role) => role?.permissions) as any[]
    ).freeze();
  }

  /**
   * Helper function to see if we can ban a user
   *
   * @public
   * @param member - Member to get permissions of
   * @param guild - Guild to get the permissions in
   * @param moderator - The user id attempting to punish the member
   * @defaultValue Default for `moderator` is the bot's id
   * @returns A promise to a boolean which maps to whether we can punish the user
   */
  public static async canBanUser(
    member: APIGuildMember,
    guild: APIGuild,
    moderator = Buffer.from(
      config.discord.TOKEN.split(".")[0]!,
      "base64"
    ).toString()
  ): Promise<boolean> {
    const clientId = Buffer.from(
      config.discord.TOKEN.split(".")[0]!,
      "base64"
    ).toString();
    const me = await api.guilds.getMember(guild.id, clientId);

    const roles = await api.guilds.getRoles(guild.id);

    const moderatorObject =
      clientId === moderator
        ? me
        : await api.guilds.getMember(guild.id, moderator);

    return (
      (await this.canManageUser(member, guild, me, roles)) &&
      (await this.getUserPermissions(moderatorObject, guild, roles)).has(
        PermissionFlagsBits.BanMembers
      ) &&
      (await this.getUserPermissions(me, guild, roles)).has(
        PermissionFlagsBits.BanMembers
      )
    );
  }

  /**
   * Helper function to see if we can kick a user
   *
   * @public
   * @param member - Member to get permissions of
   * @param guild - Guild to get the permissions in
   * @param moderator - The user id attempting to punish the member
   * @defaultValue Default for `moderator` is the bot's id
   * @returns A promise to a boolean which maps to whether we can punish the user
   */
  public static async canKickUser(
    member: APIGuildMember,
    guild: APIGuild,
    moderator = Buffer.from(
      config.discord.TOKEN.split(".")[0]!,
      "base64"
    ).toString()
  ): Promise<boolean> {
    const clientId = Buffer.from(
      config.discord.TOKEN.split(".")[0]!,
      "base64"
    ).toString();
    const me = await api.guilds.getMember(guild.id, clientId);

    const roles = await api.guilds.getRoles(guild.id);

    const moderatorObject =
      clientId === moderator
        ? me
        : await api.guilds.getMember(guild.id, moderator);

    return (
      (await this.canManageUser(member, guild, me, roles)) &&
      (await this.getUserPermissions(moderatorObject, guild, roles)).has(
        PermissionFlagsBits.KickMembers
      ) &&
      (await this.getUserPermissions(me, guild, roles)).has(
        PermissionFlagsBits.KickMembers
      )
    );
  }

  /**
   * Helper function to see if we can moderate a user
   *
   * @public
   * @param member - Member to get permissions of
   * @param guild - Guild to get the permissions in
   * @param moderator - The user id attempting to punish the member
   * @defaultValue Default for `moderator` is the bot's id
   * @returns A promise to a boolean which maps to whether we can punish the user
   */
  public static async canModerateUser(
    member: APIGuildMember,
    guild: APIGuild,
    moderator = Buffer.from(
      config.discord.TOKEN.split(".")[0]!,
      "base64"
    ).toString()
  ): Promise<boolean> {
    const clientId = Buffer.from(
      config.discord.TOKEN.split(".")[0]!,
      "base64"
    ).toString();
    const me = await api.guilds.getMember(guild.id, clientId);

    const roles = await api.guilds.getRoles(guild.id);

    const moderatorObject =
      clientId === moderator
        ? me
        : await api.guilds.getMember(guild.id, moderator);

    return (
      !(await this.getUserPermissions(member, guild, roles)).has(
        PermissionFlagsBits.Administrator
      ) &&
      (await this.canManageUser(member, guild, me, roles)) &&
      ((await this.getUserPermissions(moderatorObject, guild, roles)).has(
        PermissionFlagsBits.ModerateMembers
      ) ??
        false) &&
      (await this.getUserPermissions(me, guild, roles)).has(
        PermissionFlagsBits.KickMembers
      )
    );
  }

  /**
   * Helper function to see if we can unban a user
   *
   * @public
   * @param guild - Guild to get the permissions in
   * @param moderator - The user id attempting to punish the member
   * @defaultValue Default for `moderator` is the bot's id
   * @returns A promise to a boolean which maps to whether we can punish the user
   */
  public static async canUnbanUser(
    guild: APIGuild,
    moderator = Buffer.from(
      config.discord.TOKEN.split(".")[0]!,
      "base64"
    ).toString()
  ): Promise<boolean> {
    const clientId = Buffer.from(
      config.discord.TOKEN.split(".")[0]!,
      "base64"
    ).toString();
    const me = await api.guilds.getMember(guild.id, clientId);

    const roles = await api.guilds.getRoles(guild.id);

    const moderatorObject =
      clientId === moderator
        ? me
        : await api.guilds.getMember(guild.id, moderator);

    return (
      (await this.getUserPermissions(moderatorObject, guild, roles)).has(
        PermissionFlagsBits.BanMembers
      ) &&
      (await this.getUserPermissions(me, guild, roles)).has(
        PermissionFlagsBits.BanMembers
      )
    );
  }
}
