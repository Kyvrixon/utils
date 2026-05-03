import { Client, EmbedBuilder, GatewayIntentBits, SeparatorBuilder, SeparatorSpacingSize, TextDisplayBuilder } from "discord.js";
import { PaginationBuilder } from "./src"

declare module "bun" {
	interface Env {
		TOKEN: string;
	}
}

const bot = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessages
	]
});


bot.once("clientReady", () => console.log("bot ready"))

bot.on("messageCreate", (message) => {
	if (message.author.id !== "1498202338471575643") return;
	if (message.content !== "--pager") return;

	new PaginationBuilder(Array.from({ length: 100 }).map((_value, index) => String(index)), {
		type: "embed",
		embed: new EmbedBuilder().setColor("Purple"),
		showSkipButtons: true,
		replacements: {
			"67": "67 (:skull:)"
		},
	}).send(message)

});

await bot.login(Bun.env.TOKEN);