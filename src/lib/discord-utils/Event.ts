/** biome-ignore-all lint/suspicious/noExplicitAny: Its fine */
import type { Client, ClientEvents, RestEvents } from "discord.js";

// biome-ignore lint/suspicious/noEmptyInterface: Its fine
export interface DiscordEventCustomType {}

/** Maps an event type discriminant to its corresponding event map. */
type EventMap<T extends "client" | "rest" | "custom"> = T extends "client"
	? ClientEvents
	: T extends "rest"
		? RestEvents
		: keyof DiscordEventCustomType extends never
			? { "sooo.. there's no custom events..": [] }
			: DiscordEventCustomType;

/** Resolves the argument tuple for a given event type + key pair. */
type EventArgs<
	T extends "client" | "rest" | "custom",
	K extends keyof EventMap<T>,
> = Extract<EventMap<T>[K], any[]>;

/**
 * To define custom types:
 * @example
 * declare module "@kyvrixon/utils" {
 *   interface DiscordEventCustomType {
 *     myEventName: [data: string];
 *   }
 * }
 */
export class DiscordEvent<
	V extends Client,
	T extends "client" | "rest" | "custom",
	K extends keyof EventMap<T> = keyof EventMap<T>,
> {
	public readonly type: T;
	public readonly name: K;
	public readonly once: boolean;
	public readonly method: (
		client: V,
		...args: EventArgs<T, K>
	) => void | Promise<void>;

	constructor(opts: {
		type: T;
		name: K;
		once: boolean;
		method: DiscordEvent<V, T, K>["method"];
	}) {
		this.type = opts.type;
		this.name = opts.name;
		this.once = opts.once;
		this.method = opts.method;
	}
}
