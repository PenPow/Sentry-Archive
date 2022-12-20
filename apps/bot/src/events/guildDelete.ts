// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type { EventType, EventListener } from "../structures/Event.js";
import { Prisma } from "../db.js";

export default {
  async run({ data }) {
    await Prisma.punishment.deleteMany({ where: { guildId: data.id }});
	await Prisma.guild.delete({ where: { id: data.id }});
  },
} satisfies EventListener<EventType.GuildDelete>;
