import {Client} from "discord.js";
import {DiscordEvent} from "./src";

class ExtendedClient extends Client {
    public _____db = 1
}

const event = new DiscordEvent({
    type: "client",
    name: "clientReady",
    once: true,
    method: async (client: ExtendedClient, client1) => {}
})