/** biome-ignore-all lint/suspicious/noExplicitAny: Its fine */
import type { Client, ClientEvents, RestEvents } from "discord.js";

// biome-ignore lint/suspicious/noEmptyInterface: Its fine
export interface DiscordEventCustomType {}
/**
 * To define custom types:
 * @example
 * declare module "@kyvrixon/utils" {
 * 	interface DiscordEventCustomType {
 *			myEventName: [data: string];
 *		}
 * }
 * // You can also add these to `ClientEvents` if you wish for better typing like so:
 * declare module "discord.js" {
 * 	interface ClientEvents extends DiscordEventCustomType {}
 * }
 */
export class DiscordEvent<
	V extends Client,
	T extends "client" | "custom" | "rest" = "client",
	K extends T extends "custom"
		? keyof DiscordEventCustomType
		: T extends "client"
			? keyof ClientEvents
			: keyof RestEvents = T extends "custom"
		? keyof DiscordEventCustomType
		: T extends "client"
			? keyof ClientEvents
			: keyof RestEvents,
> {
	public readonly type: T;
	public readonly name: K;
	public readonly once: boolean;
	public readonly method: (
		client: V,
		...args: T extends "client"
			? K extends keyof ClientEvents
				? ClientEvents[K]
				: any[]
			: T extends "rest"
				? K extends keyof RestEvents
					? RestEvents[K]
					: any[]
				: K extends keyof DiscordEventCustomType
					? DiscordEventCustomType[K]
					: any[]
	) => Promise<void>;

	constructor(opts: {
		type: T;
		name: K;
		once?: boolean;
		method: DiscordEvent<V, T, K>["method"];
	}) {
		this.type = opts.type;
		this.name = opts.name;
		this.once = opts.once ?? false;
		this.method = opts.method;
	}
}
