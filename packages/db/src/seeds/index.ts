/**
 * `pnpm db:seed` — load starter content into a fresh database.
 *
 * Loads the committed curriculum snapshot when present. Otherwise falls back
 * to the built-in grammar topics; generate courses with `pnpm content:curriculum:generate`.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hasSnapshot, importSnapshot } from "./curriculum-snapshot";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
	if (hasSnapshot()) {
		console.log("Loading curriculum snapshot...");
		await importSnapshot();
		return;
	}

	console.log(
		"No curriculum snapshot found (packages/db/seed/curriculum.json). Seeding grammar topics only.",
	);
	const result = spawnSync(
		"pnpm",
		["exec", "tsx", path.join(__dirname, "grammar-topics.ts")],
		{ stdio: "inherit" },
	);
	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}
	console.log(
		"To create courses, run `pnpm content:curriculum:generate` (requires OPENAI_API_KEY).",
	);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
