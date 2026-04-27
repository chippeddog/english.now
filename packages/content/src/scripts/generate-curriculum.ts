import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({
	path: path.resolve(__dirname, "../../../../apps/server/.env"),
});

import { createOpenAI } from "@ai-sdk/openai";
import type {
	CourseBlueprint,
	CurriculumLessonContent,
	GrammarLessonContent,
	LessonTypeMix,
	LessonTypeValue,
	ListeningLessonContent,
	ReadingLessonContent,
	SpeakingLessonContent,
	UnitGoals,
	UnitTags,
	VocabularyLessonContent,
	WritingLessonContent,
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

// ─── Lesson Type Distribution per CEFR Level ─────────────────────────────────

const LESSON_TYPE_MIX: Record<string, LessonTypeMix> = {
	A1: { vocabulary: 2, grammar: 1, listening: 1, speaking: 1 },
	A2: { vocabulary: 2, grammar: 2, reading: 1, listening: 1, speaking: 1 },
	B1: { vocabulary: 1, grammar: 2, reading: 1, listening: 1, writing: 1 },
	B2: { vocabulary: 1, grammar: 2, reading: 1, listening: 1, writing: 1 },
	C1: { vocabulary: 1, grammar: 1, reading: 2, listening: 1, writing: 1 },
	C2: { grammar: 1, reading: 2, listening: 1, writing: 1, speaking: 1 },
};

const BLUEPRINT_DEFAULTS: Record<string, Partial<CourseBlueprint>> = {
	A1: {
		units: 6,
		lessonsPerUnit: 5,
		lessonTypeMix: LESSON_TYPE_MIX.A1!,
		constraints: { maxSentenceWords: 8, wordRange: [4, 6] },
	},
	A2: {
		units: 7,
		lessonsPerUnit: 5,
		lessonTypeMix: LESSON_TYPE_MIX.A2!,
		constraints: { maxSentenceWords: 12, wordRange: [6, 8] },
	},
	B1: {
		units: 8,
		lessonsPerUnit: 6,
		lessonTypeMix: LESSON_TYPE_MIX.B1!,
		constraints: { wordRange: [8, 10] },
	},
	B2: {
		units: 8,
		lessonsPerUnit: 6,
		lessonTypeMix: LESSON_TYPE_MIX.B2!,
		constraints: { wordRange: [8, 12] },
	},
	C1: {
		units: 7,
		lessonsPerUnit: 6,
		lessonTypeMix: LESSON_TYPE_MIX.C1!,
		constraints: { wordRange: [10, 14] },
	},
	C2: {
		units: 6,
		lessonsPerUnit: 6,
		lessonTypeMix: LESSON_TYPE_MIX.C2!,
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
			lessonType: z.enum([
				"grammar",
				"vocabulary",
				"reading",
				"listening",
				"speaking",
				"writing",
			]),
			description: z.string(),
			objectives: z.array(z.string()),
		}),
	),
});

const grammarContentSchema = z.object({
	rules: z.array(
		z.object({
			title: z.string(),
			explanation: z.string(),
			formula: z.string().nullable(),
			examples: z.array(
				z.object({
					sentence: z.string(),
					highlight: z.string(),
					note: z.string().nullable(),
				}),
			),
			commonMistakes: z
				.array(
					z.object({
						wrong: z.string(),
						correct: z.string(),
						why: z.string(),
					}),
				)
				.nullable(),
		}),
	),
	vocabulary: z.array(
		z.object({
			word: z.string(),
			pos: z.string().nullable(),
			definition: z.string().nullable(),
			examples: z.array(z.string()).nullable(),
		}),
	),
});

const vocabularyContentSchema = z.object({
	words: z.array(
		z.object({
			word: z.string(),
			pos: z.string(),
			definition: z.string(),
			pronunciation: z.string().nullable(),
			examples: z.array(z.string()),
			collocations: z.array(z.string()).nullable(),
			synonyms: z.array(z.string()).nullable(),
			antonyms: z.array(z.string()).nullable(),
		}),
	),
	thematicGroup: z.string().nullable(),
});

const readingContentSchema = z.object({
	passage: z.object({
		title: z.string(),
		text: z.string(),
		source: z.string().nullable(),
	}),
	glossary: z.array(z.object({ word: z.string(), definition: z.string() })),
	comprehensionFocus: z.string(),
});

const listeningContentSchema = z.object({
	audioScript: z.string(),
	listeningFocus: z.string(),
	preTasks: z.array(z.string()).nullable(),
});

const speakingContentSchema = z.object({
	dialogueExamples: z.array(
		z.object({ speaker: z.string(), text: z.string() }),
	),
	usefulPhrases: z.array(z.object({ phrase: z.string(), usage: z.string() })),
	pronunciationFocus: z
		.array(
			z.object({
				sound: z.string(),
				examples: z.array(z.string()),
			}),
		)
		.nullable(),
});

const writingContentSchema = z.object({
	writingType: z.string(),
	modelText: z.string(),
	structureGuide: z.array(
		z.object({ section: z.string(), description: z.string() }),
	),
	usefulExpressions: z.array(z.string()),
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

function stripNulls<T>(obj: T): T {
	if (obj === null || obj === undefined) return obj;
	if (Array.isArray(obj)) return obj.map(stripNulls) as T;
	if (typeof obj === "object") {
		const result: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
			result[key] = value === null ? undefined : stripNulls(value);
		}
		return result as T;
	}
	return obj;
}

function distributeLessonTypes(
	lessonCount: number,
	mix: LessonTypeMix,
): LessonTypeValue[] {
	const types: LessonTypeValue[] = [];
	const entries = Object.entries(mix).filter(([, v]) => v && v > 0) as [
		LessonTypeValue,
		number,
	][];

	const totalWeight = entries.reduce((s, [, v]) => s + v, 0);
	for (const [type, weight] of entries) {
		const count = Math.round((weight / totalWeight) * lessonCount);
		for (let i = 0; i < count; i++) types.push(type);
	}

	while (types.length < lessonCount) {
		types.push(entries[types.length % entries.length]![0]);
	}
	while (types.length > lessonCount) {
		types.pop();
	}

	return types;
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
	lessonTypes: LessonTypeValue[],
	_wordRange: [number, number],
) {
	const cefrDesc = CEFR_DESCRIPTORS[level] ?? "";

	const typeDistStr = lessonTypes.reduce(
		(acc, t) => {
			acc[t] = (acc[t] ?? 0) + 1;
			return acc;
		},
		{} as Record<string, number>,
	);
	const typeStr = Object.entries(typeDistStr)
		.map(([k, v]) => `${k}: ${v}`)
		.join(", ");

	const systemPrompt = `You are a professional ESL curriculum designer creating lessons for a CEFR ${level} course.

CEFR ${level}: ${cefrDesc}

Create exactly ${lessonCount} lessons for the unit "${unitTitle}".
Unit description: ${unitDescription}
Topics to cover: ${unitTopics.join(", ")}
Grammar focus: ${unitGrammarFocus.join(", ")}

LESSON TYPE DISTRIBUTION: ${typeStr}
The lessons should follow this exact distribution of types. Assign types in this order: ${lessonTypes.join(", ")}

LESSON TYPES:
- "grammar" = explicit grammar rule instruction with formula, examples, and common mistakes
- "vocabulary" = word learning with definitions, examples, collocations, synonyms
- "reading" = reading comprehension with passage and glossary
- "listening" = listening comprehension with audio script
- "speaking" = conversation practice with dialogue examples and useful phrases
- "writing" = written expression with model text and structure guide

Each lesson should have 2-4 learning objectives.

IMPORTANT: Lesson titles must be short descriptive names only (e.g. "Present Perfect vs Past Simple", "Making Plans & Arrangements"). Do NOT prefix titles with "Lesson 1:", "Lesson 2:", etc.`;

	const { output } = await generateText({
		model: openai("gpt-4o"),
		output: Output.object({ schema: lessonPlanSchema }),
		system: systemPrompt,
		prompt: `Generate ${lessonCount} lessons for the "${unitTitle}" unit. Use these lesson types in order: ${lessonTypes.join(", ")}`,
		temperature: 0.7,
	});

	if (!output) throw new Error(`Failed to generate lessons for "${unitTitle}"`);
	return output.lessons;
}

async function generateLessonContent(
	level: string,
	lessonTitle: string,
	lessonDescription: string,
	lessonType: LessonTypeValue,
	objectives: string[],
	wordRange: [number, number],
): Promise<CurriculumLessonContent> {
	const maxRetries = 3;
	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			return await generateLessonContentOnce(
				level,
				lessonTitle,
				lessonDescription,
				lessonType,
				objectives,
				wordRange,
			);
		} catch (err) {
			console.warn(
				`  ⚠ Attempt ${attempt}/${maxRetries} failed for [${lessonType}] "${lessonTitle}": ${err instanceof Error ? err.message : err}`,
			);
			if (attempt === maxRetries) throw err;
			await new Promise((r) => setTimeout(r, 2000 * attempt));
		}
	}
	throw new Error("Unreachable");
}

async function generateLessonContentOnce(
	level: string,
	lessonTitle: string,
	lessonDescription: string,
	lessonType: LessonTypeValue,
	objectives: string[],
	wordRange: [number, number],
): Promise<CurriculumLessonContent> {
	const cefrDesc = CEFR_DESCRIPTORS[level] ?? "";

	const base = {
		description: lessonDescription,
		objectives,
	};

	switch (lessonType) {
		case "grammar": {
			const { output } = await generateText({
				model: openai("gpt-4o"),
				output: Output.object({ schema: grammarContentSchema }),
				system: `You are an expert ESL teacher creating grammar lesson content for CEFR ${level}. ${cefrDesc}
Create detailed grammar rules with formulas, examples with highlighted parts, and common mistakes students make.
Include ${wordRange[0]}-${wordRange[1]} supporting vocabulary items.`,
				prompt: `Create grammar content for the lesson "${lessonTitle}": ${lessonDescription}\nObjectives: ${objectives.join(", ")}`,
				temperature: 0.6,
			});
			if (!output) throw new Error("Failed to generate grammar content");
			return {
				...base,
				type: "grammar",
				...stripNulls(output),
			} as GrammarLessonContent;
		}

		case "vocabulary": {
			const { output } = await generateText({
				model: openai("gpt-4o"),
				output: Output.object({ schema: vocabularyContentSchema }),
				system: `You are an expert ESL teacher creating vocabulary lesson content for CEFR ${level}. ${cefrDesc}
Create ${wordRange[0]}-${wordRange[1]} vocabulary items with definitions, parts of speech, example sentences, collocations, synonyms, and antonyms where appropriate.`,
				prompt: `Create vocabulary content for the lesson "${lessonTitle}": ${lessonDescription}\nObjectives: ${objectives.join(", ")}`,
				temperature: 0.6,
			});
			if (!output) throw new Error("Failed to generate vocabulary content");
			return {
				...base,
				type: "vocabulary",
				...stripNulls(output),
			} as VocabularyLessonContent;
		}

		case "reading": {
			const { output } = await generateText({
				model: openai("gpt-4o"),
				output: Output.object({ schema: readingContentSchema }),
				system: `You are an expert ESL teacher creating reading comprehension content for CEFR ${level}. ${cefrDesc}
Create a reading passage appropriate for this level (200-400 words for A levels, 400-600 for B levels, 600+ for C levels).
Include a glossary of key words and specify a comprehension focus.`,
				prompt: `Create reading content for the lesson "${lessonTitle}": ${lessonDescription}\nObjectives: ${objectives.join(", ")}`,
				temperature: 0.6,
			});
			if (!output) throw new Error("Failed to generate reading content");
			return {
				...base,
				type: "reading",
				...stripNulls(output),
			} as ReadingLessonContent;
		}

		case "listening": {
			const { output } = await generateText({
				model: openai("gpt-4o"),
				output: Output.object({ schema: listeningContentSchema }),
				system: `You are an expert ESL teacher creating listening comprehension content for CEFR ${level}. ${cefrDesc}
Create an audio script (a natural conversation or monologue) appropriate for this level.
Include pre-listening tasks and specify a listening focus.`,
				prompt: `Create listening content for the lesson "${lessonTitle}": ${lessonDescription}\nObjectives: ${objectives.join(", ")}`,
				temperature: 0.6,
			});
			if (!output) throw new Error("Failed to generate listening content");
			return {
				...base,
				type: "listening",
				...stripNulls(output),
			} as ListeningLessonContent;
		}

		case "speaking": {
			const { output } = await generateText({
				model: openai("gpt-4o"),
				output: Output.object({ schema: speakingContentSchema }),
				system: `You are an expert ESL teacher creating speaking practice content for CEFR ${level}. ${cefrDesc}
Create dialogue examples, useful phrases with usage context, and pronunciation focus areas.`,
				prompt: `Create speaking content for the lesson "${lessonTitle}": ${lessonDescription}\nObjectives: ${objectives.join(", ")}`,
				temperature: 0.6,
			});
			if (!output) throw new Error("Failed to generate speaking content");
			return {
				...base,
				type: "speaking",
				...stripNulls(output),
			} as SpeakingLessonContent;
		}

		case "writing": {
			const { output } = await generateText({
				model: openai("gpt-4o"),
				output: Output.object({ schema: writingContentSchema }),
				system: `You are an expert ESL teacher creating writing practice content for CEFR ${level}. ${cefrDesc}
Create a model text, structure guide, and useful expressions for the writing type.`,
				prompt: `Create writing content for the lesson "${lessonTitle}": ${lessonDescription}\nObjectives: ${objectives.join(", ")}`,
				temperature: 0.6,
			});
			if (!output) throw new Error("Failed to generate writing content");
			return {
				...base,
				type: "writing",
				...stripNulls(output),
			} as WritingLessonContent;
		}
	}
}

async function validateCurriculum(
	level: string,
	units: {
		title: string;
		lessons: { title: string; lessonType: string }[];
	}[],
) {
	const cefrDesc = CEFR_DESCRIPTORS[level] ?? "";

	const summary = units
		.map(
			(u, i) =>
				`Unit ${i + 1}: ${u.title}\n${u.lessons.map((l, j) => `  ${j + 1}. [${l.lessonType}] ${l.title}`).join("\n")}`,
		)
		.join("\n\n");

	const { output } = await generateText({
		model: openai("gpt-4o"),
		output: Output.object({ schema: validationSchema }),
		system: `You are a CEFR curriculum quality reviewer. Review this ${level} curriculum for:
1. CEFR level appropriateness (${cefrDesc})
2. Logical progression
3. No duplicate topics
4. Balanced lesson type distribution (grammar, vocabulary, reading, listening, speaking, writing)
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
	const lessonsPerUnit = lpuOverride ?? defaults.lessonsPerUnit ?? 6;
	const lessonTypeMix = defaults.lessonTypeMix ?? LESSON_TYPE_MIX.B1!;
	const wordRange = (defaults.constraints?.wordRange ?? [6, 10]) as [
		number,
		number,
	];

	const lessonTypes = distributeLessonTypes(lessonsPerUnit, lessonTypeMix);

	console.log(`\nGenerating CEFR ${level} curriculum`);
	console.log(`  Units: ${unitCount}, Lessons/unit: ${lessonsPerUnit}`);
	console.log(`  Lesson types per unit: ${lessonTypes.join(", ")}`);
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
			lessonTypes,
			wordRange,
		);
		console.log(
			`    → ${lessons.length} lessons (${lessons.map((l) => l.lessonType).join(", ")})`,
		);
		fullUnits.push({ plan, lessons });
	}

	// Step 3: Generate type-specific content for each lesson
	console.log("\nStep 3: Generating lesson content...");
	const lessonContents: Map<string, CurriculumLessonContent> = new Map();

	for (const { plan, lessons } of fullUnits) {
		for (const lesson of lessons) {
			const key = `${plan.title}::${lesson.title}`;
			console.log(`  [${lesson.lessonType}] ${lesson.title}...`);
			const content = await generateLessonContent(
				level,
				lesson.title,
				lesson.description,
				lesson.lessonType,
				lesson.objectives,
				wordRange,
			);
			lessonContents.set(key, content);
		}
	}

	// Step 4: Validate
	console.log("\nStep 4: Validating curriculum...");
	const validation = await validateCurriculum(
		level,
		fullUnits.map((u) => ({
			title: u.plan.title,
			lessons: u.lessons.map((l) => ({
				title: l.title,
				lessonType: l.lessonType,
			})),
		})),
	);

	if (!validation.isValid) {
		console.log("\n  Validation issues:");
		for (const issue of validation.issues) {
			console.log(
				`    [${issue.severity}] Unit ${issue.unitIndex + 1}${issue.lessonIndex != null ? `, Lesson ${issue.lessonIndex + 1}` : ""}: ${issue.description}`,
			);
		}
	}

	if (validation.suggestions.length > 0) {
		console.log("\n  Suggestions:");
		for (const s of validation.suggestions) {
			console.log(`    - ${s}`);
		}
	}

	// Step 5: Write to DB
	console.log("\nStep 5: Writing to database...");

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
		lessonTypeMix,
		constraints: { wordRange },
	};

	await db.insert(courseVersion).values({
		id: versionId,
		courseId: existingCourseRow.id,
		version: nextVersion,
		status: "draft",
		blueprint,
		createdBy: "agent",
		notes: `Auto-generated ${level} curriculum v${nextVersion} with typed lessons`,
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
			const key = `${plan.title}::${l.title}`;
			const content = lessonContents.get(key);

			if (!content) {
				console.log(`    WARNING: No content for ${key}, skipping`);
				continue;
			}

			// Map lesson type to a legacy blockType for backward compatibility
			const blockTypeMap: Record<string, string> = {
				grammar: "teach",
				vocabulary: "teach",
				reading: "input",
				listening: "input",
				speaking: "practice",
				writing: "practice",
			};

			await db.insert(curriculumLesson).values({
				id: crypto.randomUUID(),
				unitId,
				order: j + 1,
				slug: slugify(l.title),
				title: l.title,
				subtitle: l.subtitle,
				blockType: (blockTypeMap[l.lessonType] ?? "teach") as
					| "input"
					| "teach"
					| "practice"
					| "review"
					| "assessment",
				lessonType: l.lessonType,
				content,
				estimatedMinutes:
					l.lessonType === "reading"
						? 20
						: l.lessonType === "listening"
							? 15
							: l.lessonType === "writing"
								? 25
								: 15,
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
