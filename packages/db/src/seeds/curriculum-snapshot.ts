/**
 * Curriculum snapshot: a static, committed copy of the published course content,
 * so a fresh install has lessons without paying for AI content generation.
 *
 *   pnpm -F @english.now/db seed:export   # maintainers: write seed/curriculum.json
 *   pnpm db:seed                          # everyone: load it into DATABASE_URL
 *
 * The snapshot contains only content tables (courses, lessons, grammar topics,
 * practice sets). It never includes users or learner progress.
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { getTableColumns, getTableName, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import type { PgTable } from "drizzle-orm/pg-core";
import {
	course,
	courseVersion,
	curriculumLesson,
	curriculumUnit,
} from "../schema/curriculum";
import {
	grammarPracticeItem,
	grammarPracticeSet,
	grammarTopic,
	grammarTopicRelation,
	lessonGrammarTopic,
} from "../schema/grammar";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({
	path: path.resolve(__dirname, "../../../../apps/server/.env"),
});

export const SNAPSHOT_PATH = path.resolve(
	__dirname,
	"../../seed/curriculum.json",
);

type Row = Record<string, unknown>;
type Snapshot = {
	exportedAt: string;
	tables: Record<string, Row[]>;
};

// Insert order respects foreign keys.
const TABLES: PgTable[] = [
	course,
	courseVersion,
	curriculumUnit,
	curriculumLesson,
	grammarTopic,
	grammarTopicRelation,
	lessonGrammarTopic,
	grammarPracticeSet,
	grammarPracticeItem,
];

function getDb() {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		throw new Error("DATABASE_URL is required (set it in apps/server/.env).");
	}
	return drizzle(databaseUrl);
}

function reviveDates(table: PgTable, row: Row): Row {
	const columns = getTableColumns(table);
	const revived: Row = { ...row };
	for (const [key, column] of Object.entries(columns)) {
		const value = revived[key];
		if (column.columnType === "PgTimestamp" && typeof value === "string") {
			revived[key] = new Date(value);
		}
	}
	return revived;
}

async function exportSnapshot() {
	const db = getDb();

	const versions = await db
		.select()
		.from(courseVersion)
		.where(inArray(courseVersion.status, ["published"]));
	const versionIds = versions.map((version) => version.id);
	const courseIds = [...new Set(versions.map((version) => version.courseId))];

	const courses = courseIds.length
		? await db.select().from(course).where(inArray(course.id, courseIds))
		: [];
	const units = versionIds.length
		? await db
				.select()
				.from(curriculumUnit)
				.where(inArray(curriculumUnit.courseVersionId, versionIds))
		: [];
	const unitIds = units.map((unit) => unit.id);
	const lessons = unitIds.length
		? await db
				.select()
				.from(curriculumLesson)
				.where(inArray(curriculumLesson.unitId, unitIds))
		: [];
	const lessonIds = new Set(lessons.map((lesson) => lesson.id));

	const topics = await db.select().from(grammarTopic);
	const relations = await db.select().from(grammarTopicRelation);
	const lessonTopics = (await db.select().from(lessonGrammarTopic)).filter(
		(link) => lessonIds.has(link.lessonId),
	);
	const practiceSets = await db.select().from(grammarPracticeSet);
	const practiceItems = await db.select().from(grammarPracticeItem);

	const snapshot: Snapshot = {
		exportedAt: new Date().toISOString(),
		tables: {
			[getTableName(course)]: courses,
			[getTableName(courseVersion)]: versions.map((version) => ({
				...version,
				createdByUserId: null,
			})),
			[getTableName(curriculumUnit)]: units,
			[getTableName(curriculumLesson)]: lessons,
			[getTableName(grammarTopic)]: topics,
			[getTableName(grammarTopicRelation)]: relations,
			[getTableName(lessonGrammarTopic)]: lessonTopics,
			[getTableName(grammarPracticeSet)]: practiceSets,
			[getTableName(grammarPracticeItem)]: practiceItems,
		},
	};

	await mkdir(path.dirname(SNAPSHOT_PATH), { recursive: true });
	await writeFile(SNAPSHOT_PATH, `${JSON.stringify(snapshot, null, "\t")}\n`);

	for (const [name, rows] of Object.entries(snapshot.tables)) {
		console.log(`  ${name}: ${rows.length}`);
	}
	console.log(`Wrote ${path.relative(process.cwd(), SNAPSHOT_PATH)}`);
}

type InsertableDb = Pick<ReturnType<typeof getDb>, "insert">;

export async function importSnapshot(
	db: InsertableDb = getDb(),
	snapshotPath = SNAPSHOT_PATH,
) {
	const snapshot = JSON.parse(await readFile(snapshotPath, "utf8")) as Snapshot;

	for (const table of TABLES) {
		const name = getTableName(table);
		const rows = snapshot.tables[name] ?? [];
		const batchSize = 200;
		for (let index = 0; index < rows.length; index += batchSize) {
			const batch = rows
				.slice(index, index + batchSize)
				.map((row) => reviveDates(table, row));
			await db.insert(table).values(batch).onConflictDoNothing();
		}
		console.log(`  ${name}: ${rows.length}`);
	}

	console.log(`Loaded curriculum snapshot from ${snapshot.exportedAt}.`);
}

export function hasSnapshot() {
	return existsSync(SNAPSHOT_PATH);
}

const mode = process.argv[2];
if (mode === "export") {
	exportSnapshot()
		.then(() => process.exit(0))
		.catch((error) => {
			console.error(error);
			process.exit(1);
		});
}
