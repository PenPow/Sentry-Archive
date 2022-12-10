import { Buffer } from 'node:buffer';
import type { APIGuildTextChannel, ChannelType } from 'discord-api-types/v10';
import type { IClamAVResponse, ISuccessfulInfectedResponse } from "shared";
import { AVBroker } from "../brokers.js";
import { config } from '../config.js';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type { EventType, EventListener } from "../structures/Event.js";
import { GenericPunishment } from "../structures/Punishment.js";

export default {
	async run({ data, logger, api }) {
		if(data.author.bot || data.author.system) return;

		if(data.attachments.length > 0) {
			const results: Promise<IClamAVResponse>[] = [];
			for(const attachment of data.attachments) {
				logger.debug(`Scanning Attachment ${attachment.id}`);
				
				const data = await fetch(attachment.url);
				const arrBuffer = await data.arrayBuffer();
				const buffer = Buffer.from(arrBuffer);

				const call: Promise<IClamAVResponse> = AVBroker.call('scan', { id: attachment.id, data: buffer }, 1_000_000);
				results.push(call);
			}

			const resolved = await Promise.all(results);
			const infected: ISuccessfulInfectedResponse[] = [];
			
			for(const res of resolved) {
				if(!res.success) {
					logger.warn(`Failed to Scan Attachment ${res.id} - ${res.error}`);
					continue;
				}

				res.data.infected = true;

				if(res.data.infected) {
					logger.debug(`Attachment ${res.id} is infected with ${res.data.viruses.join(' and ')}`);
					infected.push(res as ISuccessfulInfectedResponse);
				}
			}

			if(infected.length > 0) {
				const guild = ((await api.channels.get(data.channel_id)) as APIGuildTextChannel<ChannelType.GuildText>).guild_id;
				if(!guild) return;

				const punishment = await new GenericPunishment({ guildId: guild, moderatorId: Buffer.from(config.discord.TOKEN.split(".")[0]!, "base64").toString(), reason: 'Malicious Attachment', references: null, userId: data.author.id, type: "Ban" }).build();

				if(punishment.isErr()) logger.error(`Failed to Create Punishment:\n${punishment.unwrapErr().stack}`);
			}
		}
	}
} satisfies EventListener<EventType.MessageCreate>;