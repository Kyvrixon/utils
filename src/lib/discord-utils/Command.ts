import type {
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	Client,
	SlashCommandBuilder,
	SlashCommandOptionsOnlyBuilder,
	SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";

/**
 * Wraps a discord.js slash command with typed `execute` and optional `autocomplete` handlers.
 * @typeParam C - The bot's `Client` type.
 */
export class DiscordCommand<C extends Client<boolean>> {
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
