import type { Client, ClientEvents, RestEvents } from "discord.js";

type EventType = "client" | "rest" | "custom";

export class DiscordEvent<
	T extends EventType,
	K extends T extends "custom"
		? string
		: keyof (T extends "client" ? ClientEvents : RestEvents),
	V extends Client,
> {
	public readonly type: T;
	public readonly name: K;
	public readonly once: boolean;
	public readonly method: (
		client: V,
		...args: T extends "client"
			? K extends keyof ClientEvents
				? ClientEvents[K]
				: unknown[]
			: T extends "rest"
				? K extends keyof RestEvents
					? RestEvents[K]
					: unknown[]
				: unknown[]
	) => Promise<void>;

	constructor(ops: {
		type: DiscordEvent<T, K, V>["type"];
		name: DiscordEvent<T, K, V>["name"];
		once: DiscordEvent<T, K, V>["once"];
		method: DiscordEvent<T, K, V>["method"];
	}) {
		this.type = ops.type;
		this.name = ops.name;
		this.once = ops.once;
		this.method = ops.method;
	}
}
