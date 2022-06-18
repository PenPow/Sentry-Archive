import { log, LogLevel } from "../../../common/logger.ts";
// import { bot } from "../../mod.ts";
// import { createUserPunishment, PunishentAction } from "../../../common/punishment.ts";
// import { hasPerms } from "../../../common/permissions.ts";
// import { PermissionFlags, canBotModerateMember } from "../../../common/permissions.ts";
// import { checkMessage } from "../../../common/phishing.ts";
// import { translate } from "../../languages/translate.ts";

export function setMessageCreateEvent() {
  log(
    { level: LogLevel.Info, prefix: "MessageCreate" },
    "Adding MessageCreate Handler",
  );
  // bot.events.messageCreate = async (bot, message) => {
  
    // if (
    //   message.isBot ||
    //   hasPerms(
    //     message.member?.permissions ?? 0n,
    //     PermissionFlags.MANAGE_MESSAGES,
    //   )
    // ) {
    //   return;
    // }

    // const match = await checkMessage(message.content, true)
    
    // console.log(await canBotModerateMember(bot, message.member!));

    // if (match && (await canModerateMember(bot, message, message.member!))) {
    //   await createUserPunishment(bot, { guildId: message.guildId!, action: PunishentAction.Timeout, timestamp: new Date(Date.now()), userId: message.authorId, reason: translate("en-GB", "AUTOMOD_PUNISHMENT_REASON"), moderatorId: bot.id, expiration: new Date(Date.now() + 604800) })
    // }
//   };
}
