/* eslint-disable max-statements-per-line */
import crypto from "node:crypto";
import { Stream } from "node:stream";
import { PunishmentType } from "@prisma/client";
import pkg from 'ctph.js';
import { PermissionFlagsBits } from "discord.js";
import { redis } from "../../common/db.js";
import { log, LogLevel } from "../../common/logger.js";
import { translate } from "../../common/translations/translate.js";
import { PunishmentManager } from "../managers/PunishmentManager.js";
import type { IListener } from "../structures/Listener.js";

const { digest, similarity } = pkg;

async function streamToBuffer(stream: Stream): Promise<Buffer> {
	return new Promise<Buffer>((resolve, reject) => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const _buf = Array<any>();

		stream.on("data", chunk => _buf.push(chunk));
		stream.on("end", () => resolve(Buffer.concat(_buf)));
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		stream.on("error", err => reject(`Failed Converting Stream: ${err}`));
	});
}

export type IClamAVResponse = IClamAVErrorResponse | IClamAVSuccessResponse;

interface IClamAVSuccessResponse {
	readonly success: true;
	readonly data: {
		readonly result: {
			readonly name: string;
			readonly is_infected: boolean;
			readonly viruses: string[];
		}[];
	};
}

interface IClamAVErrorResponse {
	readonly success: false;
	readonly data: {
		readonly error: string;
	};
}

const messageCreateEvent: IListener = {
	execute: function(client) {
		client.on("messageCreate", async message => {
			if (message.author.bot || message.member?.permissions.any([PermissionFlagsBits.Administrator, PermissionFlagsBits.BanMembers, PermissionFlagsBits.KickMembers, PermissionFlagsBits.ModerateMembers], true)) return;

			const guildId = message.guildId!;
			const userId = message.author.id;

			let total = 6.25;
			let reason = { msg: "Rapid Message Posting", heatAdded: total };
			total += ((message.content.match(/\n/g) ?? '').length + 1) * 2.5;
			total += (message.content.match(/o/g) ?? '').length * 0.05;

			total += (message.content.match(/(<a?)?:\w+:(\d{18}>)?/g) ?? '').length * 3;

			total += ((message.content.match(/<?(a)?:?(\w{2,32}):(\d{17,19})>?/g) ?? '').length) + (((message.content.match(/(?:\ud83d\udc68\ud83c\udffc\u200d\ud83e\udd1d\u200d\ud83d\udc68\ud83c\udffb|\ud83d\udc68\ud83c\udffd\u200d\ud83e\udd1d\u200d\ud83d\udc68\ud83c[\udffb\udffc]|\ud83d\udc68\ud83c\udffe\u200d\ud83e\udd1d\u200d\ud83d\udc68\ud83c[\udffb-\udffd]|\ud83d\udc68\ud83c\udfff\u200d\ud83e\udd1d\u200d\ud83d\udc68\ud83c[\udffb-\udffe]|\ud83d\udc69\ud83c\udffb\u200d\ud83e\udd1d\u200d\ud83d\udc68\ud83c[\udffc-\udfff]|\ud83d\udc69\ud83c\udffc\u200d\ud83e\udd1d\u200d\ud83d\udc68\ud83c[\udffb\udffd-\udfff]|\ud83d\udc69\ud83c\udffc\u200d\ud83e\udd1d\u200d\ud83d\udc69\ud83c\udffb|\ud83d\udc69\ud83c\udffd\u200d\ud83e\udd1d\u200d\ud83d\udc68\ud83c[\udffb\udffc\udffe\udfff]|\ud83d\udc69\ud83c\udffd\u200d\ud83e\udd1d\u200d\ud83d\udc69\ud83c[\udffb\udffc]|\ud83d\udc69\ud83c\udffe\u200d\ud83e\udd1d\u200d\ud83d\udc68\ud83c[\udffb-\udffd\udfff]|\ud83d\udc69\ud83c\udffe\u200d\ud83e\udd1d\u200d\ud83d\udc69\ud83c[\udffb-\udffd]|\ud83d\udc69\ud83c\udfff\u200d\ud83e\udd1d\u200d\ud83d\udc68\ud83c[\udffb-\udffe]|\ud83d\udc69\ud83c\udfff\u200d\ud83e\udd1d\u200d\ud83d\udc69\ud83c[\udffb-\udffe]|\ud83e\uddd1\ud83c\udffb\u200d\ud83e\udd1d\u200d\ud83e\uddd1\ud83c\udffb|\ud83e\uddd1\ud83c\udffc\u200d\ud83e\udd1d\u200d\ud83e\uddd1\ud83c[\udffb\udffc]|\ud83e\uddd1\ud83c\udffd\u200d\ud83e\udd1d\u200d\ud83e\uddd1\ud83c[\udffb-\udffd]|\ud83e\uddd1\ud83c\udffe\u200d\ud83e\udd1d\u200d\ud83e\uddd1\ud83c[\udffb-\udffe]|\ud83e\uddd1\ud83c\udfff\u200d\ud83e\udd1d\u200d\ud83e\uddd1\ud83c[\udffb-\udfff]|\ud83e\uddd1\u200d\ud83e\udd1d\u200d\ud83e\uddd1|\ud83d\udc6b\ud83c[\udffb-\udfff]|\ud83d\udc6c\ud83c[\udffb-\udfff]|\ud83d\udc6d\ud83c[\udffb-\udfff]|\ud83d[\udc6b-\udc6d])|(?:\ud83d[\udc68\udc69])(?:\ud83c[\udffb-\udfff])?\u200d(?:\u2695\ufe0f|\u2696\ufe0f|\u2708\ufe0f|\ud83c[\udf3e\udf73\udf93\udfa4\udfa8\udfeb\udfed]|\ud83d[\udcbb\udcbc\udd27\udd2c\ude80\ude92]|\ud83e[\uddaf-\uddb3\uddbc\uddbd])|(?:\ud83c[\udfcb\udfcc]|\ud83d[\udd74\udd75]|\u26f9)((?:\ud83c[\udffb-\udfff]|\ufe0f)\u200d[\u2640\u2642]\ufe0f)|(?:\ud83c[\udfc3\udfc4\udfca]|\ud83d[\udc6e\udc71\udc73\udc77\udc81\udc82\udc86\udc87\ude45-\ude47\ude4b\ude4d\ude4e\udea3\udeb4-\udeb6]|\ud83e[\udd26\udd35\udd37-\udd39\udd3d\udd3e\uddb8\uddb9\uddcd-\uddcf\uddd6-\udddd])(?:\ud83c[\udffb-\udfff])?\u200d[\u2640\u2642]\ufe0f|(?:\ud83d\udc68\u200d\u2764\ufe0f\u200d\ud83d\udc8b\u200d\ud83d\udc68|\ud83d\udc68\u200d\ud83d\udc68\u200d\ud83d\udc66\u200d\ud83d\udc66|\ud83d\udc68\u200d\ud83d\udc68\u200d\ud83d\udc67\u200d\ud83d[\udc66\udc67]|\ud83d\udc68\u200d\ud83d\udc69\u200d\ud83d\udc66\u200d\ud83d\udc66|\ud83d\udc68\u200d\ud83d\udc69\u200d\ud83d\udc67\u200d\ud83d[\udc66\udc67]|\ud83d\udc69\u200d\u2764\ufe0f\u200d\ud83d\udc8b\u200d\ud83d[\udc68\udc69]|\ud83d\udc69\u200d\ud83d\udc69\u200d\ud83d\udc66\u200d\ud83d\udc66|\ud83d\udc69\u200d\ud83d\udc69\u200d\ud83d\udc67\u200d\ud83d[\udc66\udc67]|\ud83d\udc68\u200d\u2764\ufe0f\u200d\ud83d\udc68|\ud83d\udc68\u200d\ud83d\udc66\u200d\ud83d\udc66|\ud83d\udc68\u200d\ud83d\udc67\u200d\ud83d[\udc66\udc67]|\ud83d\udc68\u200d\ud83d\udc68\u200d\ud83d[\udc66\udc67]|\ud83d\udc68\u200d\ud83d\udc69\u200d\ud83d[\udc66\udc67]|\ud83d\udc69\u200d\u2764\ufe0f\u200d\ud83d[\udc68\udc69]|\ud83d\udc69\u200d\ud83d\udc66\u200d\ud83d\udc66|\ud83d\udc69\u200d\ud83d\udc67\u200d\ud83d[\udc66\udc67]|\ud83d\udc69\u200d\ud83d\udc69\u200d\ud83d[\udc66\udc67]|\ud83c\udff3\ufe0f\u200d\ud83c\udf08|\ud83c\udff4\u200d\u2620\ufe0f|\ud83d\udc15\u200d\ud83e\uddba|\ud83d\udc41\u200d\ud83d\udde8|\ud83d\udc68\u200d\ud83d[\udc66\udc67]|\ud83d\udc69\u200d\ud83d[\udc66\udc67]|\ud83d\udc6f\u200d\u2640\ufe0f|\ud83d\udc6f\u200d\u2642\ufe0f|\ud83e\udd3c\u200d\u2640\ufe0f|\ud83e\udd3c\u200d\u2642\ufe0f|\ud83e\uddde\u200d\u2640\ufe0f|\ud83e\uddde\u200d\u2642\ufe0f|\ud83e\udddf\u200d\u2640\ufe0f|\ud83e\udddf\u200d\u2642\ufe0f)|[#*0-9]\ufe0f?\u20e3|(?:[©®\u2122\u265f]\ufe0f)|(?:\ud83c[\udc04\udd70\udd71\udd7e\udd7f\ude02\ude1a\ude2f\ude37\udf21\udf24-\udf2c\udf36\udf7d\udf96\udf97\udf99-\udf9b\udf9e\udf9f\udfcd\udfce\udfd4-\udfdf\udff3\udff5\udff7]|\ud83d[\udc3f\udc41\udcfd\udd49\udd4a\udd6f\udd70\udd73\udd76-\udd79\udd87\udd8a-\udd8d\udda5\udda8\uddb1\uddb2\uddbc\uddc2-\uddc4\uddd1-\uddd3\udddc-\uddde\udde1\udde3\udde8\uddef\uddf3\uddfa\udecb\udecd-\udecf\udee0-\udee5\udee9\udef0\udef3]|[\u203c\u2049\u2139\u2194-\u2199\u21a9\u21aa\u231a\u231b\u2328\u23cf\u23ed-\u23ef\u23f1\u23f2\u23f8-\u23fa\u24c2\u25aa\u25ab\u25b6\u25c0\u25fb-\u25fe\u2600-\u2604\u260e\u2611\u2614\u2615\u2618\u2620\u2622\u2623\u2626\u262a\u262e\u262f\u2638-\u263a\u2640\u2642\u2648-\u2653\u2660\u2663\u2665\u2666\u2668\u267b\u267f\u2692-\u2697\u2699\u269b\u269c\u26a0\u26a1\u26aa\u26ab\u26b0\u26b1\u26bd\u26be\u26c4\u26c5\u26c8\u26cf\u26d1\u26d3\u26d4\u26e9\u26ea\u26f0-\u26f5\u26f8\u26fa\u26fd\u2702\u2708\u2709\u270f\u2712\u2714\u2716\u271d\u2721\u2733\u2734\u2744\u2747\u2757\u2763\u2764\u27a1\u2934\u2935\u2b05-\u2b07\u2b1b\u2b1c\u2b50\u2b55\u3030\u303d\u3297\u3299])(?:\ufe0f|(?!\ufe0e))|(?:(?:\ud83c[\udfcb\udfcc]|\ud83d[\udd74\udd75\udd90]|[\u261d\u26f7\u26f9\u270c\u270d])(?:\ufe0f|(?!\ufe0e))|(?:\ud83c[\udf85\udfc2-\udfc4\udfc7\udfca]|\ud83d[\udc42\udc43\udc46-\udc50\udc66-\udc69\udc6e\udc70-\udc78\udc7c\udc81-\udc83\udc85-\udc87\udcaa\udd7a\udd95\udd96\ude45-\ude47\ude4b-\ude4f\udea3\udeb4-\udeb6\udec0\udecc]|\ud83e[\udd0f\udd18-\udd1c\udd1e\udd1f\udd26\udd30-\udd39\udd3d\udd3e\uddb5\uddb6\uddb8\uddb9\uddbb\uddcd-\uddcf\uddd1-\udddd]|[\u270a\u270b]))(?:\ud83c[\udffb-\udfff])?|(?:\ud83c\udff4\udb40\udc67\udb40\udc62\udb40\udc65\udb40\udc6e\udb40\udc67\udb40\udc7f|\ud83c\udff4\udb40\udc67\udb40\udc62\udb40\udc73\udb40\udc63\udb40\udc74\udb40\udc7f|\ud83c\udff4\udb40\udc67\udb40\udc62\udb40\udc77\udb40\udc6c\udb40\udc73\udb40\udc7f|\ud83c\udde6\ud83c[\udde8-\uddec\uddee\uddf1\uddf2\uddf4\uddf6-\uddfa\uddfc\uddfd\uddff]|\ud83c\udde7\ud83c[\udde6\udde7\udde9-\uddef\uddf1-\uddf4\uddf6-\uddf9\uddfb\uddfc\uddfe\uddff]|\ud83c\udde8\ud83c[\udde6\udde8\udde9\uddeb-\uddee\uddf0-\uddf5\uddf7\uddfa-\uddff]|\ud83c\udde9\ud83c[\uddea\uddec\uddef\uddf0\uddf2\uddf4\uddff]|\ud83c\uddea\ud83c[\udde6\udde8\uddea\uddec\udded\uddf7-\uddfa]|\ud83c\uddeb\ud83c[\uddee-\uddf0\uddf2\uddf4\uddf7]|\ud83c\uddec\ud83c[\udde6\udde7\udde9-\uddee\uddf1-\uddf3\uddf5-\uddfa\uddfc\uddfe]|\ud83c\udded\ud83c[\uddf0\uddf2\uddf3\uddf7\uddf9\uddfa]|\ud83c\uddee\ud83c[\udde8-\uddea\uddf1-\uddf4\uddf6-\uddf9]|\ud83c\uddef\ud83c[\uddea\uddf2\uddf4\uddf5]|\ud83c\uddf0\ud83c[\uddea\uddec-\uddee\uddf2\uddf3\uddf5\uddf7\uddfc\uddfe\uddff]|\ud83c\uddf1\ud83c[\udde6-\udde8\uddee\uddf0\uddf7-\uddfb\uddfe]|\ud83c\uddf2\ud83c[\udde6\udde8-\udded\uddf0-\uddff]|\ud83c\uddf3\ud83c[\udde6\udde8\uddea-\uddec\uddee\uddf1\uddf4\uddf5\uddf7\uddfa\uddff]|\ud83c\uddf4\ud83c\uddf2|\ud83c\uddf5\ud83c[\udde6\uddea-\udded\uddf0-\uddf3\uddf7-\uddf9\uddfc\uddfe]|\ud83c\uddf6\ud83c\udde6|\ud83c\uddf7\ud83c[\uddea\uddf4\uddf8\uddfa\uddfc]|\ud83c\uddf8\ud83c[\udde6-\uddea\uddec-\uddf4\uddf7-\uddf9\uddfb\uddfd-\uddff]|\ud83c\uddf9\ud83c[\udde6\udde8\udde9\uddeb-\udded\uddef-\uddf4\uddf7\uddf9\uddfb\uddfc\uddff]|\ud83c\uddfa\ud83c[\udde6\uddec\uddf2\uddf3\uddf8\uddfe\uddff]|\ud83c\uddfb\ud83c[\udde6\udde8\uddea\uddec\uddee\uddf3\uddfa]|\ud83c\uddfc\ud83c[\uddeb\uddf8]|\ud83c\uddfd\ud83c\uddf0|\ud83c\uddfe\ud83c[\uddea\uddf9]|\ud83c\uddff\ud83c[\udde6\uddf2\uddfc]|\ud83c[\udccf\udd8e\udd91-\udd9a\udde6-\uddff\ude01\ude32-\ude36\ude38-\ude3a\ude50\ude51\udf00-\udf20\udf2d-\udf35\udf37-\udf7c\udf7e-\udf84\udf86-\udf93\udfa0-\udfc1\udfc5\udfc6\udfc8\udfc9\udfcf-\udfd3\udfe0-\udff0\udff4\udff8-\udfff]|\ud83d[\udc00-\udc3e\udc40\udc44\udc45\udc51-\udc65\udc6a-\udc6d\udc6f\udc79-\udc7b\udc7d-\udc80\udc84\udc88-\udca9\udcab-\udcfc\udcff-\udd3d\udd4b-\udd4e\udd50-\udd67\udda4\uddfb-\ude44\ude48-\ude4a\ude80-\udea2\udea4-\udeb3\udeb7-\udebf\udec1-\udec5\uded0-\uded2\uded5\udeeb\udeec\udef4-\udefa\udfe0-\udfeb]|\ud83e[\udd0d\udd0e\udd10-\udd17\udd1d\udd20-\udd25\udd27-\udd2f\udd3a\udd3c\udd3f-\udd45\udd47-\udd71\udd73-\udd76\udd7a-\udda2\udda5-\uddaa\uddae-\uddb4\uddb7\uddba\uddbc-\uddca\uddd0\uddde-\uddff\ude70-\ude73\ude78-\ude7a\ude80-\ude82\ude90-\ude95]|[\u23e9-\u23ec\u23f0\u23f3\u267e\u26ce\u2705\u2728\u274c\u274e\u2753-\u2755\u2795-\u2797\u27b0\u27bf\ue50a])|\ufe0f/g) ?? '').length)); // just fyi idk what this regex tests for, but it does something, and i cant be bothered working it out

			const digestedMessage = digest(message.author.username.toLowerCase());
			if (['Hypesquad Academy', 'Hypesquad', 'Events', 'Moderator Academy', "Discord", "Moderator"].some(item => similarity(digestedMessage, digest(item.toLowerCase())) > 75)) { total += 85; reason.heatAdded < 85 ? reason = { msg: "Suspicious Username", heatAdded: 85 } : void 0; }
			if ([
				'accidentally reported your',
				'airdrop discord',
				'airdrop from steam',
				'airdrop nitro',
				'before the promotion end',
				'before the promotion ends',
				'bro steam gived nitro',
				'by steam',
				'catch the discord nitro',
				'catch the gift',
				'catch the nitro',
				'catch this discord nitro',
				'catch this gift',
				'catch this nitro',
				'click to get',
				'dicocrd',
				'dicsord',
				'discorcl',
				'discord is giving',
				'discord nitro by steam',
				'discorid',
				'distribute crypto',
				'distribution of discord',
				'distribution of nitro',
				'dlcord',
				'dlscord',
				'dsicord',
				'airdrop iscord nitro',
				'discord nitro for free',
				'distribution from steam',
				'dlscord',
				'dsicord',
				'free discord nitro for',
				'free from steam',
				'free gift discord',
				'free gift nitro',
				'free nitro for',
				'get free nitro',
				'gift for new year',
				'gift for the new year',
				'gifts for new year',
				'gifts for the new year',
				'halloween promotion',
				'hurry up and get',
				'i accidentally report you',
				'i accidentally reported you',
				'i got some nitro left over here',
				'i have some nitro left',
				'i made a game can you test',
				'i will accept trade',
				'im leaving the cs',
				'is my gift for',
				'mistakingly reported your',
				'nitro airdrop',
				'nitro code gen',
				'nitro distribution',
				'nitro for free',
				'nitro for free take it',
				'nitro free from',
				'nitro from steam take it guys',
				'nitro with steam',
				'steam admin',
				'steam are giving',
				'steam gave nitro',
				'steam give nitro',
				'steam gived nitro',
				'steam is giving',
				'take nitro fast',
				'take nitro faster',
				'valve admin',
				'who is first',
				'who will catch this gift',
				'who will get this free nitro',
				'work nitro gen',
				'working nitro gen',
				'working nitro generator',
				'you won free discord',
				'you won free nitro',
				'your free discord',
			  ].some(item => message.content.includes(item))) { total += 300; reason.heatAdded < 300 ? reason = { msg: "Malicious Phrase Detected", heatAdded: 300 } : void 0; }

			if (!message.author.avatarURL()) total += 25;

			if (/(https?:\/\/)?(www.)?(discord.(gg|io|me|li)|discordapp.com\/invite)\/[^\s/]+?(?=\b)/.exec(message.content)) { total += 90; reason.heatAdded < 90 ? reason = { msg: "Invite Detected", heatAdded: 90 } : void 0; }

			total += (message.mentions.everyone ? 65 : 0) + (message.mentions.users.size * 15);

			if (message.mentions.everyone || message.mentions.users.size) reason.heatAdded < 300 ? reason = { msg: "Mass Mentions", heatAdded: (message.mentions.everyone ? 65 : 0) + (message.mentions.users.size * 15) } : void 0;

			if (/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/.exec(message.content)) {
				const matches = message.content.match(/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g);

				for (const match of matches ?? []) {
					if (await redis.sismember('malicious-domains', crypto.createHash("sha512").update(new URL(match.startsWith("https://") || match.startsWith("http://") ? match : `https://${match}`).host).digest("hex"))) {
						total += 300;
						reason.heatAdded < 300 ? reason = { msg: "Malicious Domain Detected", heatAdded: 300 } : void 0;
					}
				}
			}

			if (similarity(await redis.get(`${guildId}-${userId}-lastMessageHash`) ?? digest(""), digest(message.content.length === 0 ? "" : message.content)) >= 75) total += 25;
			await redis.set(`${guildId}-${userId}-lastMessageHash`, digest(message.content));

			if (message.attachments.size > 0) {
				const body = new FormData();

				for (const attachment of message.attachments.values()) {
					// eslint-disable-next-line max-statements-per-line
					if (attachment.attachment instanceof Stream) { body.append('FILES', new Blob([await streamToBuffer(attachment.attachment)])); } else { body.append('FILES', new Blob([attachment.attachment.toString('utf-8')])); }
				}

				const res = await fetch("http://clamav:3000/api/v1/scan", { method: "POST", body }).catch(e => {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, no-negated-condition
					if (!(e instanceof TypeError && e.message === 'fetch failed')) log({ level: LogLevel.Fatal, prefix: 'ClamAV Handler' }, e); // Our ClamAV wasnt online yet, just ignore the message - maybe replace with a queue so that when it comes online it can do so? would have to look into the effectiveness of doing so
					else log({ level: LogLevel.Debug, prefix: 'ClamAV Handler' }, `Request to use ClamAV failed as it was offline`);
				});

				if (res && res.status === 200) {
					const raw = await res.json() as IClamAVResponse;

					// eslint-disable-next-line no-negated-condition, @typescript-eslint/brace-style
					if (!raw.success) { log({ level: LogLevel.Error, prefix: 'ClamAV Handler' }, raw.data.error); }
					else {
						for (const result of raw.data.result) {
							if (result.is_infected) { total += 300; reason.heatAdded < 300 ? reason = { msg: "Malicious File Upload", heatAdded: 300 } : void 0; }
						}
					}
				}
			}

			const userHeatResult = await PunishmentManager.setHeat(message.guildId!, message.author.id, total);
			let userHeat: number;

			try {
				userHeat = userHeatResult.unwrap()!;
			} catch (e) {
				log({ level: LogLevel.Error, prefix: 'Punishment Manager' }, e as Error);
				return;
			}

			// log({ level: LogLevel.Info, prefix: 'Heat System' }, userHeat);

			if (userHeat < 100) return;

			// eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
			await PunishmentManager.createPunishment(message.client, { userID: message.author.id, moderator: message.guild?.members.me?.id ?? message.client.user?.id!, guildID: message.guildId!, reason: translate("en-GB", "HEAT_SYSTEM_PUNISHMENT_REASON", reason.msg, userHeat), type: userHeat >= 300 ? PunishmentType.Ban : userHeat >= 225 ? PunishmentType.Softban : userHeat >= 150 ? PunishmentType.Kick : PunishmentType.Timeout, expires: userHeat < 150 ? new Date(Date.now() + (30 * 60000)) : null, reference: null });
		});
	}
};

export default messageCreateEvent;
