import type {
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	Client,
	SlashCommandBuilder,
	SlashCommandOptionsOnlyBuilder,
	SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";

export interface DiscordCommandMetadata extends Record<string, unknown> {}

/**
 * Wraps a discord.js slash command with typed `execute` and optional `autocomplete` handlers.
 * @typeParam C - The bot's `Client` type. Inferred from args[0] in `method`.
 *
 * @example To extend the `metadata` types
 * declare module "@kyvrixon/utils" {
 *     interface DiscordCommandMetadata {
 *         cooldown?: number;
 *         category?: string;
 *     }
 * }
 */
export class DiscordCommand<C extends Client> {
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
	public metadata: DiscordCommandMetadata;

	constructor(ops: {
		data: DiscordCommand<C>["data"];
		metadata: DiscordCommand<C>["metadata"];
		execute: DiscordCommand<C>["execute"];
		autocomplete?: DiscordCommand<C>["autocomplete"];
	}) {
		this.data = ops.data;
		this.metadata = ops.metadata;
		this.execute = ops.execute;
		this.autocomplete = ops.autocomplete;
	}
}
