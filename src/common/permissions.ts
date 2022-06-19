import { Message, Member, Bot, Role } from "@deps"
import { log, LogLevel } from "./logger.ts";

export const hasPerms = (permission: bigint, flags: bigint | bigint[]) => {
  if(!permission) return false;
  if (!Array.isArray(flags)) {
    if (
      (permission & PermissionFlags.ADMINISTRATOR) ==
        PermissionFlags.ADMINISTRATOR
    ) {
      return true;
    }
    return (permission & flags) == flags;
  } else {
    for (const perm of flags) {
      if (
        (permission & PermissionFlags.ADMINISTRATOR) ==
          PermissionFlags.ADMINISTRATOR
      ) {
        return true;
      }
      if (!((permission & perm) == perm)) return false;
    }
  }

  return true;
};

export const canModerateMember = async (bot: Bot, message: Message, user: Member) => {
  if(!hasPerms(user.permissions!, [PermissionFlags.MODERATE_MEMBERS, PermissionFlags.BAN_MEMBERS, PermissionFlags.KICK_MEMBERS])) return false;
  if(!hasPerms((await bot.helpers.getMember(message.guildId!, bot.id)).permissions!, [PermissionFlags.MODERATE_MEMBERS, PermissionFlags.BAN_MEMBERS, PermissionFlags.KICK_MEMBERS])) return false;

  const guildId = message.guildId!;
  const guild = await bot.helpers.getGuild(guildId);
  const memberId = user.id;
  const authorId = message.authorId;
  const botHighestRoleId = (await highestRole(bot, guildId, bot.id)).id;

  if(memberId === guild.ownerId || authorId === memberId || hasPerms(user.permissions!, [PermissionFlags.ADMINISTRATOR])) return false;
  if(!botHighestRoleId) return true;

  try {
    const memberHighestRoleId = (await highestRole(bot, guildId, memberId)).id;
    const authorHighestRoleId = (await highestRole(bot, guildId, authorId)).id;

    if(!memberHighestRoleId && authorHighestRoleId) return false;
    if(!authorHighestRoleId) return false;

    const canBotBanMember = await higherRolePosition(bot, guildId, botHighestRoleId, memberHighestRoleId);
    const canAuthorBanMember = await higherRolePosition(bot, guildId, authorHighestRoleId, memberHighestRoleId);

    if(!(canAuthorBanMember && canBotBanMember)) return true;
  }
  catch (err) {
    log({ level: LogLevel.Error, prefix: 'Permissions'}, err.message);
    return false;
  }

  return true;
}

export const canBotModerateMember = async (bot: Bot, member: Member) => {
  const guildId = member.guildId!;
  const memberId = member.id;

  if(!hasPerms((await bot.helpers.getMember(guildId, bot.id)).permissions!, [PermissionFlags.MODERATE_MEMBERS, PermissionFlags.BAN_MEMBERS, PermissionFlags.KICK_MEMBERS]) || !hasPerms((await highestRole(bot, guildId, bot.id)).permissions, [PermissionFlags.MODERATE_MEMBERS, PermissionFlags.BAN_MEMBERS, PermissionFlags.KICK_MEMBERS])) return false;
  const botHighestRoleId = (await highestRole(bot, guildId, bot.id)).id;
  const memberHighestRoleId = (await highestRole(bot, guildId, memberId)).id;

  return await higherRolePosition(bot, guildId, botHighestRoleId, memberHighestRoleId);
}

async function higherRolePosition(
  bot: Bot,
  guildId: bigint,
  roleId: bigint,
  otherRoleId: bigint,
) {
  const guild = await bot.helpers.getGuild(guildId);
  if (!guild) return true;

  const role = guild.roles.get(roleId);
  const otherRole = guild.roles.get(otherRoleId);
  if (!role || !otherRole) return new Error("No Role");

  if (role.position === otherRole.position) {
    return role.id < otherRole.id;
  }

  return role.position > otherRole.position;
}

async function highestRole(
  bot: Bot,
  guildId: bigint,
  memberId: bigint,
) {
  const guild = await bot.helpers.getGuild(guildId);
  const memberRoles = (await bot.helpers.getMember(guildId, memberId) as Member)?.roles;
  if (!memberRoles) return guild.roles.get(guild.id)!;

  let memberHighestRole: Role | undefined;

  for (const roleId of memberRoles) {
    const role = guild.roles.get(roleId);
    if (!role) continue;

    if (
      !memberHighestRole ||
      memberHighestRole.position < role.position ||
      memberHighestRole.position === role.position
    ) {
      memberHighestRole = role;
    }
  }

  return memberHighestRole!;
}

export const PermissionFlags = {
  "CREATE_INSTANT_INVITE": BigInt(1 << 0),
  "KICK_MEMBERS": BigInt(1 << 1),
  "BAN_MEMBERS": BigInt(1 << 2),
  "ADMINISTRATOR": BigInt(1 << 3),
  "MANAGE_CHANNELS": BigInt(1 << 4),
  "MANAGE_GUILD": BigInt(1 << 5),
  "ADD_REACTIONS": BigInt(1 << 6),
  "VIEW_AUDIT_LOG": BigInt(1 << 7),
  "PRIORITY_SPEAKER": BigInt(1 << 8),
  "STREAM": BigInt(1 << 9),
  "VIEW_CHANNEL": BigInt(1 << 10),
  "SEND_MESSAGES": BigInt(1 << 11),
  "SEND_TTS_MESSAGES": BigInt(1 << 12),
  "MANAGE_MESSAGES": BigInt(1 << 13),
  "EMBED_LINKS": BigInt(1 << 14),
  "ATTACH_FILES": BigInt(1 << 15),
  "READ_MESSAGE_HISTORY": BigInt(1 << 16),
  "MENTION_EVERYONE": BigInt(1 << 17),
  "USE_EXTERNAL_EMOJIS": BigInt(1 << 18),
  "VIEW_GUILD_INSIGHTS": BigInt(1 << 19),
  "CONNECT": BigInt(1 << 20),
  "SPEAK": BigInt(1 << 21),
  "MUTE_MEMBERS": BigInt(1 << 22),
  "DEAFEN_MEMBERS": BigInt(1 << 23),
  "MOVE_MEMBERS": BigInt(1 << 24),
  "USE_VAD": BigInt(1 << 25),
  "CHANGE_NICKNAME": BigInt(1 << 26),
  "MANAGE_NICKNAMES": BigInt(1 << 27),
  "MANAGE_ROLES": BigInt(1 << 28),
  "MANAGE_WEBHOOKS": BigInt(1 << 29),
  "MANAGE_EMOJIS_AND_STICKERS": BigInt(1 << 30),
  "USE_APPLICATION_COMMANDS": BigInt(1 << 31),
  "REQUEST_TO_SPEAK": BigInt(1 << 32),
  "MANAGE_EVENTS": BigInt(1 << 33),
  "MANAGE_THREADS": BigInt(1 << 34),
  "CREATE_PUBLIC_THREADS": BigInt(1 << 35),
  "CREATE_PRIVATE_THREADS": BigInt(1 << 36),
  "USE_EXTERNAL_STICKERS": BigInt(1 << 37),
  "SEND_MESSAGES_IN_THREADS": BigInt(1 << 38),
  "USE_EMBEDDED_ACTIVITIES": BigInt(1 << 39),
  "MODERATE_MEMBERS": BigInt(1 << 40),
};
