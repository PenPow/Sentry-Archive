// import { PunishmentType } from "database"
import { inspect } from "node:util";
import {
  type APIApplicationCommandOption,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord-api-types/v10";
import * as SlashCommand from "../../structures/Command.js";
import { CommandResponseType } from "../../utils/helpers.js";
// import { Punishment } from "../../structures/Punishment.js"

export default class TestCommand extends SlashCommand.Handler<ApplicationCommandType.ChatInput> {
  public override data = {
    name: "test",
    description: "punishment time he he",
    type: ApplicationCommandType.ChatInput,
  } satisfies RESTPostAPIChatInputApplicationCommandsJSONBody & {
    type: ApplicationCommandType.ChatInput;
  };

  public override options = {
    user: {
      description: "Select the User",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    // eslint-disable-next-line semi
  } satisfies Record<string, Omit<APIApplicationCommandOption, "name">>;

  public override async execute({
    getArgs,
    respond,
    interaction,
  }: SlashCommand.RunContext<TestCommand>): SlashCommand.Returnable {
    console.log("hi");

    await respond(
      interaction,
      CommandResponseType.Defer,
	  { flags: 64 }
    );

    const user = await getArgs(interaction, "user");

    // const punishment = await new Punishment({ type: PunishmentType.Timeout, reason: 'ur bad pt 4', userId: user.id, guildId: interaction.guild_id!, references: 20, expiration: new Date(new Date(Date.now()).getTime() + 50000), moderatorId: interaction.member?.user.id! }).run()

    return { content: `\`\`\`js\n${inspect(user)}\`\`\`` };
  }
}
