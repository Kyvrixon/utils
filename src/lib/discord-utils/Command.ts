import type {
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	Client,
	SlashCommandBuilder,
	SlashCommandOptionsOnlyBuilder,
	SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";

export class DiscordCommand<C extends Client<boolean> = Client<boolean>> {
	public readonly data:
		| SlashCommandBuilder
		| SlashCommandOptionsOnlyBuilder
		| SlashCommandSubcommandsOnlyBuilder;
	public readonly execute: (
		client: C,
		interaction: ChatInputCommandInteraction,
	) => Promise<void>;
	public readonly autocomplete?: (
		client: C,
		interaction: AutocompleteInteraction,
	) => Promise<void>;

	constructor(ops: {
		data: DiscordCommand<C>["data"];
		execute: DiscordCommand<C>["execute"];
		autocomplete?: DiscordCommand<C>["autocomplete"];
	}) {
		this.data = ops.data;
		this.execute = ops.execute;
		this.autocomplete = ops.autocomplete;
	}
}
