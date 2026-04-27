import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({
	path: path.resolve(__dirname, "../../../../apps/server/.env"),
});

import {
	course,
	courseVersion,
	curriculumLesson,
	curriculumUnit,
} from "@english.now/db/schema/curriculum";
import { and, asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";

const db = drizzle(process.env.DATABASE_URL!);

// ─── CLI ────────────────────────────────────────────────────────────────────

function parseArgs() {
	const [command, ...rest] = process.argv.slice(2);
	const flags: Record<string, string> = {};
	for (let i = 0; i < rest.length; i += 2) {
		const key = rest[i]?.replace(/^--/, "");
		const val = rest[i + 1];
		if (key && val) flags[key] = val;
	}
	return { command: command ?? "list", flags };
}

// ─── Commands ───────────────────────────────────────────────────────────────

async function list() {
	const courses = await db.select().from(course).orderBy(asc(course.level));

	if (courses.length === 0) {
		console.log("No courses found.");
		return;
	}

	for (const c of courses) {
		console.log(`\n${c.title} (${c.slug}) — Level: ${c.level}`);

		const versions = await db
			.select()
			.from(courseVersion)
			.where(eq(courseVersion.courseId, c.id))
			.orderBy(desc(courseVersion.version));

		for (const v of versions) {
			const unitCount = await db
				.select({ id: curriculumUnit.id })
				.from(curriculumUnit)
				.where(eq(curriculumUnit.courseVersionId, v.id));

			let lessonCount = 0;
			for (const u of unitCount) {
				const lessons = await db
					.select({ id: curriculumLesson.id })
					.from(curriculumLesson)
					.where(eq(curriculumLesson.unitId, u.id));
				lessonCount += lessons.length;
			}

			const statusIcon =
				v.status === "published"
					? "●"
					: v.status === "draft"
						? "○"
						: v.status === "archived"
							? "◌"
							: "◎";

			console.log(
				`  ${statusIcon} v${v.version} [${v.status}] — ${unitCount.length} units, ${lessonCount} lessons — by ${v.createdBy}${v.publishedAt ? ` — published ${v.publishedAt.toISOString().split("T")[0]}` : ""}`,
			);
		}
	}
}

async function review(level: string, version: number) {
	const [cv] = await db
		.select({
			id: courseVersion.id,
			version: courseVersion.version,
			status: courseVersion.status,
			blueprint: courseVersion.blueprint,
			notes: courseVersion.notes,
			createdBy: courseVersion.createdBy,
		})
		.from(courseVersion)
		.innerJoin(course, eq(course.id, courseVersion.courseId))
		.where(
			and(
				eq(course.level, level as "A1" | "A2" | "B1" | "B2" | "C1" | "C2"),
				eq(courseVersion.version, version),
			),
		)
		.limit(1);

	if (!cv) {
		console.error(`No version ${version} found for level ${level}`);
		process.exit(1);
	}

	console.log(`\n${level} v${cv.version} [${cv.status}]`);
	console.log(`Created by: ${cv.createdBy}`);
	if (cv.notes) console.log(`Notes: ${cv.notes}`);
	if (cv.blueprint)
		console.log(`Blueprint: ${JSON.stringify(cv.blueprint, null, 2)}`);

	const units = await db
		.select()
		.from(curriculumUnit)
		.where(eq(curriculumUnit.courseVersionId, cv.id))
		.orderBy(asc(curriculumUnit.order));

	for (const u of units) {
		console.log(`\n  Unit ${u.order}: ${u.title}`);
		console.log(`    ${u.description}`);
		if (u.goals) console.log(`    Goals: ${JSON.stringify(u.goals)}`);

		const lessons = await db
			.select()
			.from(curriculumLesson)
			.where(eq(curriculumLesson.unitId, u.id))
			.orderBy(asc(curriculumLesson.order));

		for (const l of lessons) {
			const content = l.content as {
				grammarPoints?: unknown[];
				vocabulary?: unknown[];
			} | null;
			const grammarCount = content?.grammarPoints?.length ?? 0;
			const vocabCount = content?.vocabulary?.length ?? 0;
			console.log(
				`      ${l.order}. [${l.blockType}] ${l.title} — ${grammarCount}G ${vocabCount}V`,
			);
		}
	}
}

async function publish(level: string, version: number) {
	const [cv] = await db
		.select({ id: courseVersion.id, status: courseVersion.status })
		.from(courseVersion)
		.innerJoin(course, eq(course.id, courseVersion.courseId))
		.where(
			and(
				eq(course.level, level as "A1" | "A2" | "B1" | "B2" | "C1" | "C2"),
				eq(courseVersion.version, version),
			),
		)
		.limit(1);

	if (!cv) {
		console.error(`No version ${version} found for level ${level}`);
		process.exit(1);
	}

	if (cv.status === "published") {
		console.log("Already published.");
		return;
	}

	await db
		.update(courseVersion)
		.set({ status: "published", publishedAt: new Date() })
		.where(eq(courseVersion.id, cv.id));

	console.log(`Published ${level} v${version}`);
}

async function archive(level: string, version: number) {
	const [cv] = await db
		.select({ id: courseVersion.id })
		.from(courseVersion)
		.innerJoin(course, eq(course.id, courseVersion.courseId))
		.where(
			and(
				eq(course.level, level as "A1" | "A2" | "B1" | "B2" | "C1" | "C2"),
				eq(courseVersion.version, version),
			),
		)
		.limit(1);

	if (!cv) {
		console.error(`No version ${version} found for level ${level}`);
		process.exit(1);
	}

	await db
		.update(courseVersion)
		.set({ status: "archived" })
		.where(eq(courseVersion.id, cv.id));

	console.log(`Archived ${level} v${version}`);
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
	const { command, flags } = parseArgs();

	switch (command) {
		case "list":
			await list();
			break;
		case "review":
			if (!flags.level || !flags.version) {
				console.error(
					"Usage: manage-curriculum.ts review --level B1 --version 1",
				);
				process.exit(1);
			}
			await review(flags.level, Number(flags.version));
			break;
		case "publish":
			if (!flags.level || !flags.version) {
				console.error(
					"Usage: manage-curriculum.ts publish --level B1 --version 1",
				);
				process.exit(1);
			}
			await publish(flags.level, Number(flags.version));
			break;
		case "archive":
			if (!flags.level || !flags.version) {
				console.error(
					"Usage: manage-curriculum.ts archive --level B1 --version 1",
				);
				process.exit(1);
			}
			await archive(flags.level, Number(flags.version));
			break;
		default:
			console.error(`Unknown command: ${command}`);
			console.error("Available: list, review, publish, archive");
			process.exit(1);
	}

	process.exit(0);
}

main().catch((err) => {
	console.error("Error:", err);
	process.exit(1);
});
