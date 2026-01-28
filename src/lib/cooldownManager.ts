export class CooldownManager {
	public cds = new Map<string, Map<string, number>>();

	set(uid: string, cmd: string, ttl: number): void {
		if (ttl <= 0) return;

		const expiry = Date.now() + ttl;
		let userCmds = this.cds.get(uid);

		if (!userCmds) {
			userCmds = new Map();
			this.cds.set(uid, userCmds);
		}

		userCmds.set(cmd, expiry);
	}

	has(uid: string, cmd: string): false | number {
		const userCmds = this.cds.get(uid);
		if (!userCmds) return false;

		const expiry = userCmds.get(cmd);
		if (!expiry) return false;

		const remaining = expiry - Date.now();
		if (remaining > 0) return remaining;

		userCmds.delete(cmd);

		if (userCmds.size === 0) this.cds.delete(uid);
		return false;
	}

	del(uid: string, cmd: string): void {
		const userCmds = this.cds.get(uid);
		if (!userCmds) return;

		userCmds.delete(cmd);

		if (userCmds.size === 0) this.cds.delete(uid);
	}

	list(): Record<string, Record<string, number>> {
		const result: ReturnType<CooldownManager["list"]> = {};
		
		for (const [uid, cmds] of this.cds) {
			const cmdsObj: Record<string, number> = {};
			for (const [cmd, expiry] of cmds) {
				cmdsObj[cmd] = expiry;
			}
			result[uid] = cmdsObj;
		}

		return result;
	}

	clean(): void {
		const now = Date.now();
		for (const [uid, cmds] of this.cds) {
			for (const [cmd, expiry] of Array.from(cmds)) {
				if (expiry < now) cmds.delete(cmd);
			}

			if (cmds.size === 0) this.cds.delete(uid);
		}
	}

	clear(): void {
		void this.cds.clear();
	}
}
