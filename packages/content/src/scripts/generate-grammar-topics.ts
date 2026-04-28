import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({
	path: path.resolve(__dirname, "../../../../apps/server/.env"),
});

import { createOpenAI } from "@ai-sdk/openai";
import {
	course,
	courseVersion,
	curriculumLesson,
	curriculumUnit,
} from "@english.now/db/schema/curriculum";
import type { GrammarTopicContent } from "@english.now/db/schema/grammar";
import {
	grammarTopic,
	grammarTopicRelation,
	lessonGrammarTopic,
} from "@english.now/db/schema/grammar";
import { generateText, Output } from "ai";
import { and, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { z } from "zod";

const databaseUrl = process.env.DATABASE_URL;
const openAiApiKey = process.env.OPENAI_API_KEY;

if (!databaseUrl) {
	throw new Error("DATABASE_URL is required to generate grammar topics.");
}

if (!openAiApiKey) {
	throw new Error("OPENAI_API_KEY is required to generate grammar topics.");
}

const db = drizzle(databaseUrl);
const openai = createOpenAI({ apiKey: openAiApiKey });

const CEFR_DESCRIPTORS: Record<string, string> = {
	A1: "Can understand and use familiar everyday expressions and very basic phrases. Can introduce themselves and ask/answer personal questions.",
	A2: "Can understand frequently used expressions related to immediate relevance and communicate in simple routine tasks.",
	B1: "Can understand the main points of clear standard input on familiar matters and produce simple connected text on familiar topics.",
	B2: "Can understand the main ideas of complex text and interact with fluency and spontaneity.",
	C1: "Can understand demanding texts and use language flexibly and effectively for social, academic, and professional purposes.",
	C2: "Can understand virtually everything heard or read and express themselves very fluently and precisely.",
};

const topicPlanSchema = z.object({
	topics: z.array(
		z.object({
			slug: z.string(),
			title: z.string(),
			category: z.string(),
			summary: z.string(),
			estimatedMinutes: z.number().int().min(5).max(25),
			prerequisites: z.array(z.string()),
			relatedTopics: z.array(z.string()),
			nextTopics: z.array(z.string()),
			lessonTitleHints: z.array(z.string()),
		}),
	),
});

const grammarBlockColorSchema = z.enum(["success", "error", "ai"]);

const grammarPatternPartSchema = z.object({
	text: z.string(),
	role: z.enum(["subject", "verb", "auxiliary", "object", "rest", "modifier"]),
	highlight: z.boolean().nullable(),
});

const grammarPatternSchema = z.object({
	slots: z.array(z.string()).min(2).max(6),
	example: z.object({
		parts: z.array(grammarPatternPartSchema).min(2).max(8),
	}),
});

const grammarMistakeSchema = z.object({
	wrong: z.string(),
	correct: z.string(),
	why: z.string(),
});

const grammarContrastItemSchema = z.object({
	wrong: z.string(),
	right: z.string(),
	why: z.string(),
});

const grammarPairSideSchema = z.object({
	label: z.string(),
	sentence: z.string(),
	highlight: z.string(),
	hint: z.string(),
});

type DecisionTreeNode =
	| {
			question: string;
			yes: DecisionTreeNode;
			no: DecisionTreeNode;
	  }
	| {
			answer: string;
			example: string;
	  };

const decisionTreeNodeSchema: z.ZodType<DecisionTreeNode> = z.lazy(() =>
	z.union([
		z.object({
			question: z.string().max(80),
			yes: decisionTreeNodeSchema,
			no: decisionTreeNodeSchema,
		}),
		z.object({
			answer: z.string().max(30),
			example: z.string().max(80),
		}),
	]),
);

const grammarExplanationSectionSchema = z.discriminatedUnion("kind", [
	z.object({
		kind: z.literal("rule"),
		text: z.string().min(10).max(300),
	}),
	z.object({
		kind: z.literal("form"),
		title: z.string().min(2).max(60),
		color: grammarBlockColorSchema,
		pattern: grammarPatternSchema,
		examples: z.array(z.string().min(2).max(100)).min(2).max(5),
		note: z.string().max(160).nullable(),
	}),
	z.object({
		kind: z.literal("contrast"),
		title: z.string().max(40).nullable(),
		items: z.array(grammarContrastItemSchema).min(1).max(4),
	}),
	z.object({
		kind: z.literal("signal"),
		title: z.string().max(40).nullable(),
		rule: z.string().min(5).max(200),
		cues: z.array(z.string().min(1).max(40)).min(2).max(12),
	}),
	z.object({
		kind: z.literal("table"),
		title: z.string().max(40).nullable(),
		columns: z.array(z.string()).length(2),
		rows: z.array(z.array(z.string()).length(2)).min(2).max(12),
		note: z.string().max(160).nullable(),
	}),
	z.object({
		kind: z.literal("pair"),
		title: z.string().max(40).nullable(),
		left: grammarPairSideSchema,
		right: grammarPairSideSchema,
	}),
]);

const grammarExplanationSchema = z.object({
	intro: z.string().min(10).max(240),
	sections: z.array(grammarExplanationSectionSchema).min(1).max(8),
});

const grammarQuickMapSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("forms_table"),
		title: z.string(),
		icon: z.string().nullable(),
		columns: z.array(z.string()).length(2),
		rows: z
			.array(
				z.object({
					from: z.string(),
					to: z.string(),
				}),
			)
			.min(2)
			.max(12),
	}),
	z.object({
		type: z.literal("tense_card"),
		title: z.string(),
		icon: z.string().nullable(),
		blocks: z
			.array(
				z.object({
					label: z.string().max(20),
					color: grammarBlockColorSchema,
					formula: z.string().min(3).max(80),
					example: z.string().min(2).max(80),
				}),
			)
			.min(2)
			.max(4),
		signals: z.array(z.string().max(30)).max(10).nullable(),
	}),
	z.object({
		type: z.literal("formula"),
		title: z.string(),
		icon: z.string().nullable(),
		slots: z.array(z.string()).min(2).max(6),
		example: z.string().min(3).max(80),
	}),
	z.object({
		type: z.literal("decision_tree"),
		title: z.string(),
		icon: z.string().nullable(),
		root: decisionTreeNodeSchema,
	}),
	z.object({
		type: z.literal("timeline"),
		title: z.string(),
		icon: z.string().nullable(),
		anchor: z.literal("now"),
		events: z
			.array(
				z.object({
					label: z.string().max(40),
					position: z.enum([
						"past",
						"past-to-now",
						"now",
						"now-to-future",
						"future",
					]),
					marker: z.enum(["point", "span"]),
				}),
			)
			.min(1)
			.max(5),
		caption: z.string().max(120),
	}),
	z.object({
		type: z.literal("minimal_pair"),
		title: z.string(),
		icon: z.string().nullable(),
		left: grammarPairSideSchema,
		right: grammarPairSideSchema,
	}),
	z.object({
		type: z.literal("register_ladder"),
		title: z.string(),
		icon: z.string().nullable(),
		tiers: z
			.array(
				z.object({
					level: z.enum(["formal", "neutral", "casual"]),
					example: z.string().max(80),
				}),
			)
			.length(3),
	}),
	z.object({
		type: z.literal("clock"),
		title: z.string(),
		icon: z.string().nullable(),
		variant: z.enum(["day", "week", "year"]),
		slots: z
			.array(
				z.object({
					preposition: z.string().max(8),
					examples: z.array(z.string().max(40)).min(1).max(4),
				}),
			)
			.min(2)
			.max(4),
	}),
]);

const grammarContentSchema = z.object({
	description: z.string(),
	objectives: z.array(z.string()).min(2).max(4),
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
				.array(grammarMistakeSchema)
				.nullable(),
		}),
	),
	explanation: grammarExplanationSchema,
	quickMap: grammarQuickMapSchema,
	notes: z.array(z.string()).nullable(),
	practice: z
		.object({
			recommendedExerciseTypes: z.array(z.string()).nullable(),
			promptTemplates: z.array(z.string()).nullable(),
			difficulty: z.enum(["easy", "medium", "hard"]).nullable(),
		})
		.nullable(),
});

type TopicPlan = z.infer<typeof topicPlanSchema>["topics"][number];
type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

type CandidateLesson = {
	id: string;
	title: string;
	slug: string;
	unitSlug: string;
	level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
};

function parseArgs() {
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
		level: (flags.level ?? "A1") as "A1" | "A2" | "B1" | "B2" | "C1" | "C2",
		count: Number(flags.count ?? 6),
		category: flags.category,
		topic: flags.topic,
		slug: flags.slug,
		linkLessons: flags["link-lessons"] !== "false",
	};
}

function slugify(text: string) {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");
}

function normalizeText(text: string) {
	return slugify(text);
}

function makeTopicId(slug: string) {
	return `grammar_topic:${slug}`;
}

function makeRelationId(fromSlug: string, toSlug: string, kind: string) {
	return `grammar_relation:${kind}:${fromSlug}:${toSlug}`;
}

function makeLessonTopicId(lessonId: string, topicId: string, kind: string) {
	return `lesson_grammar_topic:${lessonId}:${topicId}:${kind}`;
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

function normalizePlannedTopic(topic: TopicPlan): TopicPlan {
	return {
		...topic,
		slug: slugify(topic.slug || topic.title),
		prerequisites: Array.isArray(topic.prerequisites)
			? topic.prerequisites
			: [],
		relatedTopics: Array.isArray(topic.relatedTopics)
			? topic.relatedTopics
			: [],
		nextTopics: Array.isArray(topic.nextTopics) ? topic.nextTopics : [],
		lessonTitleHints: Array.isArray(topic.lessonTitleHints)
			? topic.lessonTitleHints
			: [],
	};
}

async function generateTopicPlan(
	level: string,
	count: number,
	category?: string,
	existingSlugs: string[] = [],
) {
	const cefrDescription = CEFR_DESCRIPTORS[level] ?? "";
	const categoryInstruction = category
		? `Focus only on the category "${category}".`
		: "Cover a useful mix of foundational grammar categories for this CEFR level.";

	const { output } = await generateText({
		model: openai("gpt-4o"),
		output: Output.object({ schema: topicPlanSchema }),
		system: `You are an expert ESL grammar curriculum designer.

Generate canonical grammar topics for CEFR ${level}.
CEFR descriptor: ${cefrDescription}

Requirements:
- Create exactly ${count} grammar topics
- Topics must be useful as standalone grammar library entries
- Each topic must have a unique slug
- Prerequisites, relatedTopics, and nextTopics must reference slugs within the generated set when possible
- Summaries should be concise and learner-friendly
- lessonTitleHints should contain 0-3 phrases that could help match the topic to guided lesson titles
- Avoid duplicates or near-duplicates
- ${categoryInstruction}

Already existing slugs to avoid: ${existingSlugs.join(", ") || "none"}`,
		prompt: `Generate a canonical grammar topic plan for level ${level}.`,
		temperature: 0.6,
	});

	if (!output) {
		throw new Error("Failed to generate grammar topic plan");
	}

	return output.topics.map(normalizePlannedTopic);
}

async function generateSingleTopicPlan(
	level: string,
	topicName: string,
	category?: string,
	slug?: string,
) {
	const cefrDescription = CEFR_DESCRIPTORS[level] ?? "";
	const categoryInstruction = category
		? `Use the category "${category}".`
		: "Choose the best concise grammar category.";
	const requestedSlug = slugify(slug || topicName);

	const { output } = await generateText({
		model: openai("gpt-4o"),
		output: Output.object({ schema: topicPlanSchema }),
		system: `You are an expert ESL grammar curriculum designer.

Create exactly one canonical grammar library topic for CEFR ${level}.
CEFR descriptor: ${cefrDescription}

Requirements:
- The topic must be about "${topicName}"
- Return exactly one topic
- Use slug "${requestedSlug}"
- Keep title canonical and learner-friendly
- Summary should explain what the learner will understand and use
- Include 0-3 lessonTitleHints for matching guided grammar lessons
- ${categoryInstruction}`,
		prompt: `Create one grammar topic plan for "${topicName}" at level ${level}.`,
		temperature: 0.4,
	});

	if (!output?.topics[0]) {
		throw new Error(`Failed to generate topic plan for "${topicName}"`);
	}

	return [
		normalizePlannedTopic({
			...output.topics[0],
			slug: requestedSlug,
		}),
	];
}

async function generateTopicContent(
	level: string,
	topic: TopicPlan,
): Promise<GrammarTopicContent> {
	const cefrDescription = CEFR_DESCRIPTORS[level] ?? "";

	const { output } = await generateText({
		model: openai("gpt-4o"),
		output: Output.object({ schema: grammarContentSchema }),
		system: `You are an expert ESL grammar teacher creating canonical grammar library content for CEFR ${level}.

CEFR descriptor: ${cefrDescription}

Requirements:
- Produce complete, learner-friendly grammar theory
- Include 2-4 objectives
- Include 1-3 rules with clear explanations
- Examples must be natural, level-appropriate, and highlight the target form
- Include common mistakes learners really make
- Keep content reusable across lessons, not lesson-specific
- Legacy rules.commonMistakes must use fields wrong, correct, and why.

Structured explanation requirements:
- Also generate explanation.intro and explanation.sections for a premium visual lesson view.
- Always include one rule section and one contrast section.
- Structured contrast sections must use fields wrong, right, and why.
- Use form sections for tense, modal, article, preposition, and pattern topics. For tense topics, include positive, negative, and question form sections with colors success, error, and ai.
- Use table sections for closed form sets such as pronouns, possessives, plurals, irregular forms, and auxiliary tables.
- Use pair sections for direct two-way contrasts such as for/since, this/that, much/many, and some/any.
- Use signal sections for tense, modal, time, and frequency topics.
- Keep section text concise and adult: work, travel, technology, relationships, study, and daily life.
- Pattern example parts must mark the target grammar part with highlight: true.

Quick map requirements:
- Generate exactly one quickMap for the topic.
- Pick the first matching type: tense_card, forms_table, minimal_pair, decision_tree, timeline, formula, register_ladder, clock.
- Use tense_card for verb tenses and modals; exactly three blocks when the topic has positive, negative, and question forms.
- Use forms_table for closed paired forms.
- Use minimal_pair for exactly two confusing forms.
- Use decision_tree for choosing among three or more options.
- Use timeline for concepts mainly about when something happens.
- Use formula for one reusable sentence pattern.
- Use register_ladder for formality and politeness.
- Use clock for in/on/at time prepositions.
- Use camelCase field names exactly: quickMap, not quick_map.
- For nullable fields such as title, note, icon, signals, and highlight, output null when the value is not needed.`,
		prompt: `Create canonical grammar topic content for:
Title: ${topic.title}
Category: ${topic.category}
Summary: ${topic.summary}
Prerequisites: ${topic.prerequisites.join(", ") || "none"}`,
		temperature: 0.6,
	});

	if (!output) {
		throw new Error(`Failed to generate content for "${topic.title}"`);
	}

	return {
		...stripNulls(output),
		vocabulary: [],
	} as GrammarTopicContent;
}

async function loadPublishedGrammarLessons(
	level: string,
): Promise<CandidateLesson[]> {
	return db
		.select({
			id: curriculumLesson.id,
			title: curriculumLesson.title,
			slug: curriculumLesson.slug,
			unitSlug: curriculumUnit.slug,
			level: course.level,
		})
		.from(curriculumLesson)
		.innerJoin(curriculumUnit, eq(curriculumUnit.id, curriculumLesson.unitId))
		.innerJoin(
			courseVersion,
			eq(courseVersion.id, curriculumUnit.courseVersionId),
		)
		.innerJoin(course, eq(course.id, courseVersion.courseId))
		.where(
			and(
				eq(courseVersion.status, "published"),
				eq(curriculumLesson.lessonType, "grammar"),
				eq(course.level, level as CandidateLesson["level"]),
			),
		);
}

function matchesLesson(lesson: CandidateLesson, topic: TopicPlan) {
	const topicSlug = normalizeText(topic.slug);
	const topicTitle = normalizeText(topic.title);
	const lessonSlug = normalizeText(lesson.slug);
	const lessonTitle = normalizeText(lesson.title);
	const hints = topic.lessonTitleHints.map(normalizeText);

	if (lessonSlug === topicSlug || lessonTitle === topicTitle) {
		return true;
	}

	if (lessonTitle.includes(topicTitle) || lessonSlug.includes(topicSlug)) {
		return true;
	}

	return hints.some(
		(hint) => lessonTitle.includes(hint) || lessonSlug.includes(hint),
	);
}

async function upsertTopics(
	level: CefrLevel,
	plannedTopics: TopicPlan[],
	linkLessons: boolean,
) {
	const existingPublishedTopics = await db
		.select({ id: grammarTopic.id })
		.from(grammarTopic)
		.where(
			inArray(
				grammarTopic.slug,
				plannedTopics.map((topic) => topic.slug),
			),
		);

	if (existingPublishedTopics.length > 0) {
		console.log(
			`Updating ${existingPublishedTopics.length} existing topics for level ${level}.`,
		);
	}

	const contentBySlug = new Map<string, GrammarTopicContent>();
	for (const topic of plannedTopics) {
		console.log(`Generating content for ${topic.title}...`);
		contentBySlug.set(topic.slug, await generateTopicContent(level, topic));
	}

	for (const topic of plannedTopics) {
		const content = contentBySlug.get(topic.slug);
		if (!content) {
			throw new Error(`Missing generated content for topic "${topic.slug}"`);
		}

		await db
			.insert(grammarTopic)
			.values({
				id: makeTopicId(topic.slug),
				slug: topic.slug,
				title: topic.title,
				summary: topic.summary,
				cefrLevel: level,
				category: topic.category,
				estimatedMinutes: topic.estimatedMinutes,
				content,
				isPublished: true,
				updatedAt: new Date(),
			})
			.onConflictDoUpdate({
				target: grammarTopic.slug,
				set: {
					id: makeTopicId(topic.slug),
					title: topic.title,
					summary: topic.summary,
					cefrLevel: level,
					category: topic.category,
					estimatedMinutes: topic.estimatedMinutes,
					content,
					isPublished: true,
					updatedAt: new Date(),
				},
			});
	}

	const topicIds = plannedTopics.map((topic) => makeTopicId(topic.slug));
	await db
		.delete(grammarTopicRelation)
		.where(inArray(grammarTopicRelation.fromTopicId, topicIds));
	await db
		.delete(lessonGrammarTopic)
		.where(inArray(lessonGrammarTopic.grammarTopicId, topicIds));

	const plannedSlugSet = new Set(plannedTopics.map((topic) => topic.slug));

	for (const topic of plannedTopics) {
		for (const prerequisite of topic.prerequisites) {
			if (!plannedSlugSet.has(prerequisite)) continue;
			await db.insert(grammarTopicRelation).values({
				id: makeRelationId(topic.slug, prerequisite, "prerequisite"),
				fromTopicId: makeTopicId(topic.slug),
				toTopicId: makeTopicId(prerequisite),
				kind: "prerequisite",
			});
		}

		for (const related of topic.relatedTopics) {
			if (!plannedSlugSet.has(related)) continue;
			await db.insert(grammarTopicRelation).values({
				id: makeRelationId(topic.slug, related, "related"),
				fromTopicId: makeTopicId(topic.slug),
				toTopicId: makeTopicId(related),
				kind: "related",
			});
		}

		for (const nextTopic of topic.nextTopics) {
			if (!plannedSlugSet.has(nextTopic)) continue;
			await db.insert(grammarTopicRelation).values({
				id: makeRelationId(topic.slug, nextTopic, "next"),
				fromTopicId: makeTopicId(topic.slug),
				toTopicId: makeTopicId(nextTopic),
				kind: "next",
			});
		}
	}

	if (!linkLessons) {
		return;
	}

	const lessons = await loadPublishedGrammarLessons(level);
	for (const topic of plannedTopics) {
		const matchingLessons = lessons.filter((lesson) =>
			matchesLesson(lesson, topic),
		);
		let sortOrder = 0;
		for (const lesson of matchingLessons) {
			await db.insert(lessonGrammarTopic).values({
				id: makeLessonTopicId(lesson.id, makeTopicId(topic.slug), "teach"),
				lessonId: lesson.id,
				grammarTopicId: makeTopicId(topic.slug),
				kind: "teach",
				sortOrder,
			});
			sortOrder += 1;
		}
	}
}

async function main() {
	const { level, count, category, topic, slug, linkLessons } = parseArgs();
	console.log(
		topic
			? `Generating grammar topic "${topic}" for ${level}...`
			: `Generating ${count} canonical grammar topics for ${level}...`,
	);

	const existingSlugs = await db
		.select({ slug: grammarTopic.slug })
		.from(grammarTopic)
		.where(eq(grammarTopic.cefrLevel, level))
		.then((rows) => rows.map((row) => row.slug));

	const plan = topic
		? await generateSingleTopicPlan(level, topic, category, slug)
		: await generateTopicPlan(level, count, category, existingSlugs);
	console.log(`Generated topic plan with ${plan.length} topics.`);

	await upsertTopics(level, plan, linkLessons);

	console.log(
		`Completed grammar generation for ${level}. Topics are stored in grammar_topic.content JSONB.`,
	);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
