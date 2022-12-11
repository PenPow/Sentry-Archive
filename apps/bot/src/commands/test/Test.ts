// import { PunishmentType } from "database"
import { inspect } from "node:util";
import {
  type APIApplicationCommandOption,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord-api-types/v10";
import * as SlashCommand from "../../structures/Command.js";
// import { GenericPunishment } from "../../structures/Punishment.js";
import { ExpiringPunishment } from "../../structures/Punishment.js";

export default class TestCommand extends SlashCommand.Handler<ApplicationCommandType.ChatInput> {
  public override data = {
    name: "test",
    description: "punishment time he he",
    type: ApplicationCommandType.ChatInput,
  } satisfies Omit<
    RESTPostAPIChatInputApplicationCommandsJSONBody,
    "options"
  > & {
    type: ApplicationCommandType.ChatInput;
  };

  public override options = {
    user: {
      description: "Select the User",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
  } satisfies { [string: string]: Omit<APIApplicationCommandOption, "name"> };

  public override async execute({
    getArgs,
    interaction,
  }: SlashCommand.RunContext<TestCommand>): SlashCommand.Returnable {
    const user = await getArgs(interaction, "user");

    // const punishment = new GenericPunishment({ })

    const punishment = await new ExpiringPunishment({
      type: "Ban",
      reason: "ur bad pt 5",
      userId: user.id,
      guildId: interaction.guild_id!,
      references: null,
      expires: new Date(new Date(Date.now()).getTime() + 10_000),
      moderatorId: interaction.member!.user.id,
    }).build();

    return { content: `\`\`\`js\n${inspect(punishment)}\`\`\`` };
  }
}
