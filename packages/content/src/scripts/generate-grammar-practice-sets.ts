import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({
	path: path.resolve(__dirname, "../../../../apps/server/.env"),
});

import { generateGrammarDrill } from "@english.now/api/services/generate-grammar-drill";
import type {
	GrammarItemPhase,
	GrammarSessionItem,
	GrammarTopicContent,
} from "@english.now/db/schema/grammar";
import {
	grammarPracticeItem,
	grammarPracticeSet,
	grammarTopic,
} from "@english.now/db/schema/grammar";
import { and, desc, eq, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error(
		"DATABASE_URL is required to generate grammar practice sets.",
	);
}

const db = drizzle(databaseUrl);

type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

type CliArgs = {
	topic?: string;
	slug?: string;
	level?: CefrLevel;
	count: number;
	nativeLanguage?: string;
	deactivateOld: boolean;
};

function parseArgs(): CliArgs {
	const args = process.argv.slice(2);
	const flags: Record<string, string> = {};

	for (let i = 0; i < args.length; i += 1) {
		const arg = args[i];
		if (!arg || arg === "--" || !arg.startsWith("--")) {
			continue;
		}

		const [rawKey, inlineValue] = arg.slice(2).split("=", 2);
		const nextValue = args[i + 1];
		const value =
			inlineValue ??
			(nextValue && nextValue !== "--" && !nextValue.startsWith("--")
				? nextValue
				: undefined);

		if (rawKey && value) {
			flags[rawKey] = value;
			if (value === nextValue) {
				i += 1;
			}
		}
	}

	return {
		topic: flags.topic,
		slug: flags.slug,
		level: flags.level as CefrLevel | undefined,
		count: Number(flags.count ?? 30),
		nativeLanguage: flags["native-language"],
		deactivateOld: flags["deactivate-old"] !== "false",
	};
}

function slugify(text: string) {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");
}

function getDifficultyMix(count: number) {
	const safeCount = Math.max(10, count);
	const controlled = Math.max(2, Math.round(safeCount * 0.45));
	const semi = Math.max(2, Math.round(safeCount * 0.35));
	const freer = Math.max(1, safeCount - controlled - semi);

	return { controlled, semi, freer };
}

function toPracticePhase(
	phase: GrammarItemPhase,
): Exclude<GrammarItemPhase, "diagnose"> {
	return phase === "diagnose" ? "controlled" : phase;
}

function normalizePracticeItem(
	item: GrammarSessionItem,
	itemId: string,
): GrammarSessionItem {
	return {
		...item,
		id: itemId,
		phase: toPracticePhase(item.phase),
	};
}

function hashItem(item: GrammarSessionItem) {
	const hashable = {
		phase: item.phase,
		type: item.type,
		difficulty: item.difficulty,
		prompt: item.prompt,
		options: item.options,
		items: item.items,
		correctAnswer: item.correctAnswer,
		ruleTitle: item.ruleTitle,
	};

	return createHash("sha256").update(JSON.stringify(hashable)).digest("hex");
}

async function findTopic({ topic, slug, level }: CliArgs) {
	const normalizedSlug = slug
		? slugify(slug)
		: topic
			? slugify(topic)
			: undefined;

	if (!normalizedSlug && !topic) {
		throw new Error('Pass --topic "present simple" or --slug present-simple.');
	}

	const filters = [
		eq(grammarTopic.isPublished, true),
		normalizedSlug
			? or(
					eq(grammarTopic.slug, normalizedSlug),
					eq(grammarTopic.title, topic ?? ""),
				)
			: eq(grammarTopic.title, topic ?? ""),
	];

	if (level) {
		filters.push(eq(grammarTopic.cefrLevel, level));
	}

	const [resolvedTopic] = await db
		.select()
		.from(grammarTopic)
		.where(and(...filters))
		.limit(1);

	if (!resolvedTopic) {
		throw new Error(
			`Grammar topic not found for ${slug ?? topic}${
				level ? ` at level ${level}` : ""
			}. Generate the topic first.`,
		);
	}

	return resolvedTopic;
}

async function nextSetVersion(grammarTopicId: string) {
	const [latestSet] = await db
		.select({ version: grammarPracticeSet.version })
		.from(grammarPracticeSet)
		.where(eq(grammarPracticeSet.grammarTopicId, grammarTopicId))
		.orderBy(desc(grammarPracticeSet.version))
		.limit(1);

	return (latestSet?.version ?? 0) + 1;
}

async function main() {
	const args = parseArgs();
	const topic = await findTopic(args);
	const requestedCount = Math.max(10, args.count);
	const version = await nextSetVersion(topic.id);
	const setId = `grammar_practice_set:${topic.slug}:v${version}`;

	console.log(
		`Generating ${requestedCount} practice items for "${topic.title}" (${topic.cefrLevel})...`,
	);

	const drill = await generateGrammarDrill({
		topic: {
			title: topic.title,
			cefrLevel: topic.cefrLevel,
			category: topic.category,
			content: topic.content as GrammarTopicContent,
		},
		nativeLanguage: args.nativeLanguage,
		difficultyMix: getDifficultyMix(requestedCount),
		mode: "practice_only",
	});

	const items = drill.items
		.filter((item) => item.phase !== "diagnose")
		.slice(0, requestedCount);

	if (items.length < 10) {
		throw new Error(
			`Generated only ${items.length} practice items; expected at least 10.`,
		);
	}

	if (args.deactivateOld) {
		await db
			.update(grammarPracticeSet)
			.set({ isActive: false, updatedAt: new Date() })
			.where(eq(grammarPracticeSet.grammarTopicId, topic.id));
	}

	await db.insert(grammarPracticeSet).values({
		id: setId,
		grammarTopicId: topic.id,
		version,
		itemCount: 0,
		metadata: {
			model: "gpt-5.4-mini",
			promptVersion: "grammar-drill-v1",
			nativeLanguage: args.nativeLanguage ?? null,
			source: "script",
		},
		isActive: true,
		updatedAt: new Date(),
	});

	let insertedCount = 0;
	for (const item of items) {
		const itemId = crypto.randomUUID();
		const normalizedItem = normalizePracticeItem(item, itemId);
		const itemHash = hashItem(normalizedItem);

		const inserted = await db
			.insert(grammarPracticeItem)
			.values({
				id: itemId,
				setId,
				grammarTopicId: topic.id,
				phase: toPracticePhase(normalizedItem.phase),
				type: normalizedItem.type,
				difficulty: normalizedItem.difficulty,
				ruleTitle: normalizedItem.ruleTitle,
				item: normalizedItem,
				itemHash,
				isActive: true,
				updatedAt: new Date(),
			})
			.onConflictDoNothing()
			.returning({ id: grammarPracticeItem.id });

		insertedCount += inserted.length;
	}

	await db
		.update(grammarPracticeSet)
		.set({ itemCount: insertedCount, updatedAt: new Date() })
		.where(eq(grammarPracticeSet.id, setId));

	console.log(
		`Stored ${insertedCount} practice items in ${setId}. Run sessions will sample 10 items from the active pool.`,
	);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
