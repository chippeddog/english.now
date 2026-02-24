import { env } from "@english.now/env/server";
import { PgBoss } from "pg-boss";

let boss: PgBoss | null = null;

export function getQueue(): PgBoss {
	if (!boss) {
		boss = new PgBoss(env.DATABASE_URL);
		boss.on("error", (error: Error) => {
			console.error("[pg-boss] error:", error);
		});
	}

	return boss;
}
