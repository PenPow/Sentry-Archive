import { psql } from "./db.ts";
import {
  Bot
} from "@deps";

export function getUserCases(
  guildId: bigint,
  userId: bigint,
): Promise<PostgresBasePunishment[]> {
  return psql`SELECT * from "Punishment" WHERE "userId" = ${userId.toString()} AND "guildId" = ${guildId.toString()}`;
}

export async function createUserPunishment(
  bot: Bot,
  data: Punishment,
) {
  const caseId = ((await getCaseId(data.guildId)).length > 0 ? (await getCaseId(data.guildId))[0].caseId : 0) + 1

  switch(data.action) {
    case PunishentAction.AntiRaidNuke:
    case PunishentAction.Ban:
      await bot.helpers.banMember(data.guildId, data.userId, { deleteMessageDays: 7, reason: data.reason })
      break;
    case PunishentAction.Kick:
      await bot.helpers.kickMember(data.guildId, data.userId, data.reason)
      break;
    case PunishentAction.Softban:
      await bot.helpers.banMember(data.guildId, data.userId, { deleteMessageDays: 7, reason: data.reason })
      await bot.helpers.unbanMember(data.guildId, data.userId)
      break;
    case PunishentAction.Timeout:
      await bot.helpers.editMember(data.guildId, data.userId, { communicationDisabledUntil: data.expiration.getTime()});
      break;
  }

  return psql`INSERT INTO "Punishment" ("caseId", "action", "reason", "userId", "guildId", "moderatorId") VALUES (${caseId}, ${data.action}, ${data.reason}, ${data.userId}, ${data.guildId}, ${data.moderatorId});`;
}

function getCaseId(guildId: bigint) {
  return psql
    `SELECT * FROM "Punishment" WHERE  "guildId" = ${guildId.toString()} ORDER  BY "caseId" DESC LIMIT  1;`;
}

export enum PunishentAction {
  AntiRaidNuke,
  Ban,
  Kick,
  Softban,
  Timeout,
  Warn,
}

export type PostgresPunishment = PostgresBasePunishment | PostgresExpiringPunishment

export interface PostgresBasePunishment extends BasePunishment {
  caseId: string;
}

export interface PostgresExpiringPunishment extends ExpiringPunishment {
  caseId: string;
}

export type Punishment = BasePunishment | ExpiringPunishment;

interface BasePunishment {
  timestamp: Date;
  userId: bigint;
  guildId: bigint;
  action: Exclude<PunishentAction, PunishentAction.Timeout>;
  reason: string;
  moderatorId: bigint;
}

interface ExpiringPunishment {
  timestamp: Date;
  userId: bigint;
  guildId: bigint;
  action: PunishentAction.Timeout;
  reason: string;
  moderatorId: bigint;
  expiration: Date;
}
