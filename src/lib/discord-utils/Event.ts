/** biome-ignore-all lint/suspicious/noExplicitAny: it's fine */
import type { Client, ClientEvents, RestEvents } from "discord.js";

type EventType = "client" | "rest" | "custom";

export class DiscordEvent<
	C extends Record<string, any[]> = {
		"you forgot to pass in your types!": []
	},
	V extends Client = Client,
	T extends EventType = EventType,
> {
	public readonly type: T;
	public readonly name: string;
	public readonly once: boolean;
	public readonly method: (client: V, ...args: any[]) => Promise<void>;

	constructor(
		ops: T extends "custom"
			? {
					type: "custom";
					name: keyof C;
					once: boolean;
					method: (client: V, ...args: C[keyof C]) => Promise<void>;
				}
			: T extends "client"
				? {
						type: "client";
						name: keyof ClientEvents;
						once: boolean;
						method: (
							client: V,
							...args: ClientEvents[keyof ClientEvents]
						) => Promise<void>;
					}
				: {
						type: "rest";
						name: keyof RestEvents;
						once: boolean;
						method: (
							client: V,
							...args: RestEvents[keyof RestEvents]
						) => Promise<void>;
					},
	) {
		this.type = ops.type as T;
		this.name = String(ops.name);
		this.once = ops.once;
		this.method = ops.method;
	}
}
