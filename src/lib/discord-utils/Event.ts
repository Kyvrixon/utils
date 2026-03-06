/** biome-ignore-all lint/suspicious/noExplicitAny: it's fine */
import type { Client, ClientEvents, RestEvents } from "discord.js";

type EventType = "client" | "rest" | "custom";
type DefaultTyping = { "You forgot to pass in your types to the class!": [] };

export class DiscordEvent<
	V extends Client = Client,
	C extends Record<string, any[]> = DefaultTyping,
	T extends EventType = "custom",
	K extends
		| keyof C
		| keyof ClientEvents
		| keyof RestEvents = keyof DefaultTyping,
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
				: K extends keyof C
					? C[K]
					: any[]
	) => Promise<void>;

	constructor(ops: {
		type: T;
		name: K;
		once: boolean;
		method: DiscordEvent<V, C, T, K>["method"];
	}) {
		this.type = ops.type;
		this.name = ops.name;
		this.once = ops.once;
		this.method = ops.method;
	}
}
