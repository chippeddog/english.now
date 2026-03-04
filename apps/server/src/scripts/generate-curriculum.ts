import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import { createOpenAI } from "@ai-sdk/openai";
import type {
	CourseBlueprint,
	CurriculumLessonContent,
	UnitGoals,
	UnitTags,
} from "@english.now/db/schema/curriculum";
import {
	course,
	courseVersion,
	curriculumLesson,
	curriculumUnit,
} from "@english.now/db/schema/curriculum";
import { generateText, Output } from "ai";
import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { z } from "zod";

const db = drizzle(process.env.DATABASE_URL!);
const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// ─── CLI Args ───────────────────────────────────────────────────────────────

function parseArgs() {
	const args = process.argv.slice(2);
	const flags: Record<string, string> = {};
	for (let i = 0; i < args.length; i += 2) {
		const key = args[i]?.replace(/^--/, "");
		const val = args[i + 1];
		if (key && val) flags[key] = val;
	}
	return {
		level: (flags.level ?? "A2") as "A1" | "A2" | "B1" | "B2" | "C1" | "C2",
		units: Number(flags.units) || undefined,
		lessonsPerUnit: Number(flags["lessons-per-unit"]) || undefined,
	};
}

// ─── CEFR Descriptors ───────────────────────────────────────────────────────

const CEFR_DESCRIPTORS: Record<string, string> = {
	A1: "Can understand and use familiar everyday expressions and very basic phrases. Can introduce themselves and ask/answer personal questions.",
	A2: "Can understand frequently used expressions (personal info, shopping, local geography, employment). Can communicate in simple routine tasks.",
	B1: "Can understand main points on familiar matters (work, school, leisure). Can deal with most travel situations. Can produce simple connected text.",
	B2: "Can understand main ideas of complex text. Can interact with fluency and spontaneity. Can produce clear, detailed text on wide range of subjects.",
	C1: "Can understand demanding, longer texts with implicit meaning. Can express ideas fluently and spontaneously. Can use language flexibly for social, academic, and professional purposes.",
	C2: "Can understand virtually everything heard or read. Can summarize information from different spoken and written sources. Can express themselves spontaneously, very fluently and precisely.",
};

const BLUEPRINT_DEFAULTS: Record<string, Partial<CourseBlueprint>> = {
	A1: {
		units: 6,
		lessonsPerUnit: 4,
		blockMix: { input: 1, teach: 2, practice: 1 },
		constraints: { maxSentenceWords: 8, wordRange: [4, 6] },
	},
	A2: {
		units: 7,
		lessonsPerUnit: 4,
		blockMix: { input: 1, teach: 2, practice: 1, review: 1 },
		constraints: { maxSentenceWords: 12, wordRange: [6, 8] },
	},
	B1: {
		units: 8,
		lessonsPerUnit: 4,
		blockMix: { teach: 3, practice: 1, review: 1, input: 1 },
		constraints: { wordRange: [8, 10] },
	},
	B2: {
		units: 8,
		lessonsPerUnit: 5,
		blockMix: { teach: 2, practice: 2, review: 1, input: 1, assessment: 1 },
		constraints: { wordRange: [8, 12] },
	},
	C1: {
		units: 7,
		lessonsPerUnit: 5,
		blockMix: { teach: 2, practice: 2, input: 2, assessment: 1 },
		constraints: { wordRange: [10, 14] },
	},
	C2: {
		units: 6,
		lessonsPerUnit: 5,
		blockMix: { teach: 1, practice: 2, input: 2, assessment: 1 },
		constraints: { wordRange: [12, 16] },
	},
};

// ─── Zod Schemas ────────────────────────────────────────────────────────────

const unitPlanSchema = z.object({
	units: z.array(
		z.object({
			title: z.string(),
			description: z.string(),
			topics: z.array(z.string()),
			grammarFocus: z.array(z.string()),
			communicativeFunctions: z.array(z.string()),
		}),
	),
});

const lessonPlanSchema = z.object({
	lessons: z.array(
		z.object({
			title: z.string(),
			subtitle: z.string(),
			blockType: z.enum(["input", "teach", "practice", "review", "assessment"]),
			description: z.string(),
			grammarPoints: z.array(
				z.object({
					title: z.string(),
					description: z.string(),
					examples: z.array(z.string()),
				}),
			),
			vocabulary: z.array(
				z.object({
					word: z.string(),
					pos: z.string(),
					definition: z.string(),
				}),
			),
		}),
	),
});

const validationSchema = z.object({
	isValid: z.boolean(),
	issues: z.array(
		z.object({
			unitIndex: z.number(),
			lessonIndex: z.number().nullable(),
			severity: z.enum(["error", "warning"]),
			description: z.string(),
		}),
	),
	suggestions: z.array(z.string()),
});

// ─── Helpers ────────────────────────────────────────────────────────────────

function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");
}

// ─── Pipeline ───────────────────────────────────────────────────────────────

async function generateUnitPlan(
	level: string,
	unitCount: number,
	existingExample?: string,
) {
	const cefrDesc = CEFR_DESCRIPTORS[level] ?? "";

	const systemPrompt = `You are a professional ESL curriculum designer. Design a complete course structure for CEFR level ${level}.

CEFR ${level} descriptor: ${cefrDesc}

Design exactly ${unitCount} units. Each unit should:
- Have a clear thematic focus
- Progress logically from simpler to more complex topics
- Cover key grammar, vocabulary, and communicative functions appropriate for ${level}
- Include communicative functions (e.g., "making requests", "describing experiences")

IMPORTANT: Unit titles must be short topic names only (e.g. "Everyday Communication", "Telling Stories"). Do NOT prefix titles with "Unit 1:", "Unit 2:", etc.

${existingExample ? `Here is an example of how a B1 course is structured for reference (match this level of detail but adjust for ${level}):\n${existingExample}` : ""}`;

	const { output } = await generateText({
		model: openai("gpt-4o"),
		output: Output.object({ schema: unitPlanSchema }),
		system: systemPrompt,
		prompt: `Create a ${unitCount}-unit course structure for CEFR ${level} English learners.`,
		temperature: 0.7,
	});

	if (!output) throw new Error("Failed to generate unit plan");
	return output.units;
}

async function generateLessonsForUnit(
	level: string,
	unitTitle: string,
	unitDescription: string,
	unitTopics: string[],
	unitGrammarFocus: string[],
	lessonCount: number,
	blockMix: CourseBlueprint["blockMix"],
	wordRange: [number, number],
) {
	const cefrDesc = CEFR_DESCRIPTORS[level] ?? "";

	const blockMixStr = Object.entries(blockMix)
		.filter(([, v]) => v && v > 0)
		.map(([k, v]) => `${k}: ${v}`)
		.join(", ");

	const systemPrompt = `You are a professional ESL curriculum designer creating lessons for a CEFR ${level} course.

CEFR ${level}: ${cefrDesc}

Create exactly ${lessonCount} lessons for the unit "${unitTitle}".
Unit description: ${unitDescription}
Topics to cover: ${unitTopics.join(", ")}
Grammar focus: ${unitGrammarFocus.join(", ")}

Block type distribution guide: ${blockMixStr}
- "teach" = explicit grammar/vocabulary instruction
- "input" = reading or listening comprehensible input
- "practice" = interactive exercises
- "review" = spaced review of prior material
- "assessment" = quiz/test

Each lesson should have ${wordRange[0]}-${wordRange[1]} vocabulary items.
Grammar lessons should have 1-3 grammar points with clear rules and examples.
Vocabulary lessons can have 0 grammar points.

IMPORTANT: Lesson titles must be short descriptive names only (e.g. "Present Perfect vs Past Simple", "Making Plans & Arrangements"). Do NOT prefix titles with "Lesson 1:", "Lesson 2:", etc.`;

	const { output } = await generateText({
		model: openai("gpt-4o"),
		output: Output.object({ schema: lessonPlanSchema }),
		system: systemPrompt,
		prompt: `Generate ${lessonCount} lessons for the "${unitTitle}" unit.`,
		temperature: 0.7,
	});

	if (!output) throw new Error(`Failed to generate lessons for "${unitTitle}"`);
	return output.lessons;
}

async function validateCurriculum(
	level: string,
	units: { title: string; lessons: { title: string; blockType: string }[] }[],
) {
	const cefrDesc = CEFR_DESCRIPTORS[level] ?? "";

	const summary = units
		.map(
			(u, i) =>
				`Unit ${i + 1}: ${u.title}\n${u.lessons.map((l, j) => `  ${j + 1}. [${l.blockType}] ${l.title}`).join("\n")}`,
		)
		.join("\n\n");

	const { output } = await generateText({
		model: openai("gpt-4o"),
		output: Output.object({ schema: validationSchema }),
		system: `You are a CEFR curriculum quality reviewer. Review this ${level} curriculum for:
1. CEFR level appropriateness (${cefrDesc})
2. Logical progression
3. No duplicate topics
4. Balanced block type distribution
5. Grammar and vocabulary coverage`,
		prompt: `Review this CEFR ${level} curriculum:\n\n${summary}`,
		temperature: 0.3,
	});

	if (!output) throw new Error("Validation failed");
	return output;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
	const {
		level,
		units: unitCountOverride,
		lessonsPerUnit: lpuOverride,
	} = parseArgs();

	const defaults = BLUEPRINT_DEFAULTS[level] ?? BLUEPRINT_DEFAULTS.B1!;
	const unitCount = unitCountOverride ?? defaults.units ?? 8;
	const lessonsPerUnit = lpuOverride ?? defaults.lessonsPerUnit ?? 4;
	const blockMix = defaults.blockMix ?? { teach: 3, practice: 1 };
	const wordRange = (defaults.constraints?.wordRange ?? [6, 10]) as [
		number,
		number,
	];

	console.log(`\nGenerating CEFR ${level} curriculum`);
	console.log(`  Units: ${unitCount}, Lessons/unit: ${lessonsPerUnit}`);
	console.log(`  Block mix: ${JSON.stringify(blockMix)}`);
	console.log(`  Word range: ${wordRange[0]}-${wordRange[1]}\n`);

	// Fetch existing B1 as few-shot example
	let existingExample: string | undefined;
	const [existingCourse] = await db
		.select({ id: courseVersion.id })
		.from(courseVersion)
		.innerJoin(course, eq(course.id, courseVersion.courseId))
		.where(eq(course.level, "B1"))
		.orderBy(desc(courseVersion.version))
		.limit(1);

	if (existingCourse) {
		const existingUnits = await db
			.select({
				title: curriculumUnit.title,
				description: curriculumUnit.description,
			})
			.from(curriculumUnit)
			.where(eq(curriculumUnit.courseVersionId, existingCourse.id))
			.orderBy(curriculumUnit.order);

		if (existingUnits.length > 0) {
			existingExample = existingUnits
				.map((u, i) => `Unit ${i + 1}: ${u.title} - ${u.description}`)
				.join("\n");
		}
	}

	// Step 1: Plan units
	console.log("Step 1: Generating unit plan...");
	const unitPlans = await generateUnitPlan(level, unitCount, existingExample);
	console.log(`  Generated ${unitPlans.length} units`);

	// Step 2: Generate lessons for each unit
	console.log("\nStep 2: Generating lessons...");
	const fullUnits: {
		plan: (typeof unitPlans)[number];
		lessons: Awaited<ReturnType<typeof generateLessonsForUnit>>;
	}[] = [];

	for (const plan of unitPlans) {
		console.log(`  Unit: ${plan.title}...`);
		const lessons = await generateLessonsForUnit(
			level,
			plan.title,
			plan.description,
			plan.topics,
			plan.grammarFocus,
			lessonsPerUnit,
			blockMix,
			wordRange,
		);
		console.log(`    → ${lessons.length} lessons`);
		fullUnits.push({ plan, lessons });
	}

	// Step 3: Validate
	console.log("\nStep 3: Validating curriculum...");
	const validation = await validateCurriculum(
		level,
		fullUnits.map((u) => ({
			title: u.plan.title,
			lessons: u.lessons.map((l) => ({
				title: l.title,
				blockType: l.blockType,
			})),
		})),
	);

	if (!validation.isValid) {
		console.log("\n  Validation issues:");
		for (const issue of validation.issues) {
			console.log(
				`    [${issue.severity}] Unit ${issue.unitIndex + 1}${issue.lessonIndex !== undefined ? `, Lesson ${issue.lessonIndex + 1}` : ""}: ${issue.description}`,
			);
		}
	}

	if (validation.suggestions.length > 0) {
		console.log("\n  Suggestions:");
		for (const s of validation.suggestions) {
			console.log(`    - ${s}`);
		}
	}

	// Step 4: Write to DB
	console.log("\nStep 4: Writing to database...");

	const levelSlug = `english-${level.toLowerCase()}`;
	let [existingCourseRow] = await db
		.select({ id: course.id })
		.from(course)
		.where(eq(course.slug, levelSlug))
		.limit(1);

	if (!existingCourseRow) {
		const courseId = crypto.randomUUID();
		await db.insert(course).values({
			id: courseId,
			slug: levelSlug,
			title: `${level} English`,
			description: `CEFR ${level} English course`,
			level,
			targetLang: "en",
			isActive: true,
		});
		existingCourseRow = { id: courseId };
		console.log(`  Created course: ${levelSlug}`);
	}

	const [latestVersion] = await db
		.select({ version: courseVersion.version })
		.from(courseVersion)
		.where(eq(courseVersion.courseId, existingCourseRow.id))
		.orderBy(desc(courseVersion.version))
		.limit(1);

	const nextVersion = (latestVersion?.version ?? 0) + 1;
	const versionId = crypto.randomUUID();

	const blueprint: CourseBlueprint = {
		level,
		units: unitCount,
		lessonsPerUnit,
		blockMix,
		constraints: { wordRange },
	};

	await db.insert(courseVersion).values({
		id: versionId,
		courseId: existingCourseRow.id,
		version: nextVersion,
		status: "draft",
		blueprint,
		createdBy: "agent",
		notes: `Auto-generated ${level} curriculum v${nextVersion}`,
	});
	console.log(`  Created version: v${nextVersion} (draft)`);

	let totalLessons = 0;
	for (let i = 0; i < fullUnits.length; i++) {
		const { plan, lessons } = fullUnits[i]!;
		const unitId = crypto.randomUUID();

		const goals: UnitGoals = {
			grammar: plan.grammarFocus,
			functions: plan.communicativeFunctions,
		};
		const tags: UnitTags = {
			topics: plan.topics,
			register: "neutral",
		};

		await db.insert(curriculumUnit).values({
			id: unitId,
			courseVersionId: versionId,
			order: i + 1,
			slug: slugify(plan.title),
			title: plan.title,
			description: plan.description,
			goals,
			tags,
		});

		for (let j = 0; j < lessons.length; j++) {
			const l = lessons[j]!;
			const content: CurriculumLessonContent = {
				description: l.description,
				grammarPoints: l.grammarPoints,
				vocabulary: l.vocabulary,
				exerciseHints: {
					types: ["multiple_choice", "fill_in_the_blank"],
					count: Math.max(6, l.grammarPoints.length * 2 + l.vocabulary.length),
				},
			};

			await db.insert(curriculumLesson).values({
				id: crypto.randomUUID(),
				unitId,
				order: j + 1,
				slug: slugify(l.title),
				title: l.title,
				subtitle: l.subtitle,
				blockType: l.blockType,
				content,
				estimatedMinutes: l.grammarPoints.length > 0 ? 15 : 10,
			});
			totalLessons++;
		}
	}

	console.log(
		`\nDone! Generated ${fullUnits.length} units with ${totalLessons} lessons.`,
	);
	console.log(
		"Status: DRAFT — run manage-curriculum.ts publish to make it live.\n",
	);
	process.exit(0);
}

main().catch((err) => {
	console.error("Generation failed:", err);
	process.exit(1);
});
