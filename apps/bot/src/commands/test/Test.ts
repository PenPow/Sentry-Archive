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
import { UnbanPunishment } from "../../structures/Punishment.js";

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
    const user = getArgs(interaction, "user");

    // const punishment = new GenericPunishment({ })

    const punishment = await new UnbanPunishment({
      reason: "ur bad pt 6",
      userId: user.id,
      guildId: interaction.guild_id!,
      references: null,
      moderatorId: interaction.member!.user.id,
    }).build();

    return { content: `\`\`\`js\n${inspect(punishment)}\`\`\`` };
  }
}
