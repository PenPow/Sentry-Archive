import { API } from "@discordjs/core";
import { REST as RestClient } from "@discordjs/rest";
import { config } from "./config.js";

const REST = new RestClient({
  version: "10",
  api: "http://rest:3000/api",
}).setToken(config.discord.TOKEN);

export const api = new API(REST);
