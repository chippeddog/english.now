import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import {
	course,
	courseVersion,
	curriculumLesson,
	curriculumUnit,
} from "../schema/curriculum";
import type { GrammarTopicContent } from "../schema/grammar";
import {
	grammarTopic,
	grammarTopicRelation,
	lessonGrammarTopic,
} from "../schema/grammar";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({
	path: path.resolve(__dirname, "../../../../apps/server/.env"),
});

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error("DATABASE_URL is required to seed grammar topics.");
}

const db = drizzle(databaseUrl);

type SeedTopic = {
	slug: string;
	title: string;
	cefrLevel: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
	category: string;
	summary: string;
	estimatedMinutes?: number;
	prerequisites?: string[];
	relatedTopics?: string[];
	nextTopics?: string[];
	content: GrammarTopicContent;
	lessonMatchers?: Array<{
		level?: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
		unitSlug?: string;
		lessonSlug?: string;
		titleIncludes?: string;
		kind?: "teach" | "practice" | "review";
	}>;
};

const TOPICS: SeedTopic[] = [
	{
		slug: "to-be",
		title: "Verb To Be",
		cefrLevel: "A1",
		category: "Verbs",
		summary:
			"Use am, is, and are to talk about identity, feelings, and location.",
		estimatedMinutes: 8,
		relatedTopics: ["present-continuous"],
		nextTopics: ["present-simple"],
		content: {
			description:
				"The verb to be is one of the most important building blocks in English. Learners use it to describe who people are, how they feel, and where things are.",
			objectives: [
				"Use am, is, and are correctly with different subjects",
				"Write simple affirmative, negative, and question forms",
			],
			rules: [
				{
					title: "Choose the correct form",
					explanation:
						"Use am with I, is with he/she/it, and are with you/we/they.",
					formula: "I am / He is / They are",
					examples: [
						{ sentence: "I am tired.", highlight: "am" },
						{ sentence: "She is my teacher.", highlight: "is" },
						{ sentence: "They are at home.", highlight: "are" },
					],
					commonMistakes: [
						{
							wrong: "I is ready.",
							correct: "I am ready.",
							why: "I always takes am.",
						},
						{
							wrong: "They is late.",
							correct: "They are late.",
							why: "Plural subjects take are.",
						},
					],
				},
			],
			vocabulary: [
				{ word: "identity", definition: "who a person is" },
				{ word: "location", definition: "where someone or something is" },
			],
			notes: [
				"Contracted forms like I'm and she's are common in spoken English.",
			],
			practice: {
				recommendedExerciseTypes: [
					"multiple_choice",
					"fill_in_the_blank",
					"sentence_correction",
				],
				difficulty: "easy",
			},
		},
		lessonMatchers: [
			{ level: "A1", titleIncludes: "to be", kind: "teach" },
			{ level: "A1", titleIncludes: "verb to be", kind: "teach" },
		],
	},
	{
		slug: "present-simple",
		title: "Present Simple",
		cefrLevel: "A1",
		category: "Tenses",
		summary: "Talk about habits, routines, facts, and repeated actions.",
		estimatedMinutes: 10,
		prerequisites: ["to-be"],
		relatedTopics: ["present-continuous"],
		nextTopics: ["past-simple"],
		content: {
			description:
				"The present simple helps learners describe everyday routines and facts that are generally true.",
			objectives: [
				"Describe routines and repeated actions",
				"Use do and does in negatives and questions",
				"Add -s correctly in the third person singular",
			],
			rules: [
				{
					title: "Use the base verb for routines and facts",
					explanation:
						"Use the present simple for daily habits, schedules, and things that are always true.",
					formula: "Subject + base verb (+ s/es for he/she/it)",
					examples: [
						{
							sentence: "I drink coffee every morning.",
							highlight: "drink",
						},
						{ sentence: "He works in London.", highlight: "works" },
						{
							sentence: "Water boils at 100 degrees.",
							highlight: "boils",
						},
					],
					commonMistakes: [
						{
							wrong: "He work every day.",
							correct: "He works every day.",
							why: "Third person singular usually needs -s.",
						},
						{
							wrong: "Does she works here?",
							correct: "Does she work here?",
							why: "After does, use the base form.",
						},
					],
				},
			],
			vocabulary: [
				{ word: "routine", definition: "a regular way of doing things" },
				{ word: "habit", definition: "something you do often" },
			],
			practice: {
				recommendedExerciseTypes: [
					"fill_in_the_blank",
					"sentence_transformation",
					"error_identification",
				],
				difficulty: "easy",
			},
		},
		lessonMatchers: [
			{ level: "A1", titleIncludes: "present simple", kind: "teach" },
		],
	},
	{
		slug: "present-continuous",
		title: "Present Continuous",
		cefrLevel: "A1",
		category: "Tenses",
		summary: "Describe actions happening now or around the present moment.",
		estimatedMinutes: 10,
		prerequisites: ["to-be"],
		relatedTopics: ["present-simple"],
		content: {
			description:
				"The present continuous combines the verb to be with a verb ending in -ing to show actions in progress.",
			objectives: [
				"Build present continuous sentences with be + verb-ing",
				"Choose when to use the present continuous instead of the present simple",
			],
			rules: [
				{
					title: "Use be plus verb-ing for actions in progress",
					explanation:
						"Use the present continuous for actions happening now, temporary situations, and near-future arrangements.",
					formula: "Subject + am/is/are + verb-ing",
					examples: [
						{ sentence: "I am reading now.", highlight: "am reading" },
						{
							sentence: "They are studying for the test.",
							highlight: "are studying",
						},
						{
							sentence: "She is meeting Sam later.",
							highlight: "is meeting",
						},
					],
					commonMistakes: [
						{
							wrong: "She reading now.",
							correct: "She is reading now.",
							why: "You still need the verb to be.",
						},
						{
							wrong: "I am go to work.",
							correct: "I am going to work.",
							why: "The main verb needs the -ing form.",
						},
					],
				},
			],
			vocabulary: [
				{ word: "temporary", definition: "lasting for a short time" },
				{ word: "arrangement", definition: "a planned meeting or activity" },
			],
			practice: {
				recommendedExerciseTypes: [
					"multiple_choice",
					"fill_in_the_blank",
					"reorder_words",
				],
				difficulty: "easy",
			},
		},
		lessonMatchers: [
			{ level: "A1", titleIncludes: "present continuous", kind: "teach" },
		],
	},
	{
		slug: "past-simple",
		title: "Past Simple",
		cefrLevel: "A2",
		category: "Tenses",
		summary: "Talk about finished actions and events in the past.",
		estimatedMinutes: 12,
		prerequisites: ["present-simple"],
		content: {
			description:
				"The past simple is used for completed actions and past events with a clear finished time.",
			objectives: [
				"Use regular and common irregular past forms",
				"Ask and answer questions about finished events",
			],
			rules: [
				{
					title: "Use the past form for finished time",
					explanation:
						"Use the past simple when the time is finished, for example yesterday, last week, or in 2020.",
					formula: "Subject + past form",
					examples: [
						{
							sentence: "We visited Paris last summer.",
							highlight: "visited",
						},
						{ sentence: "She went home early.", highlight: "went" },
						{
							sentence: "Did you watch the film?",
							highlight: "Did",
						},
					],
					commonMistakes: [
						{
							wrong: "Did you watched it?",
							correct: "Did you watch it?",
							why: "After did, use the base form.",
						},
						{
							wrong: "I go to the shop yesterday.",
							correct: "I went to the shop yesterday.",
							why: "Finished past time needs the past form.",
						},
					],
				},
			],
			vocabulary: [
				{ word: "finished time", definition: "a time period that is complete" },
				{
					word: "irregular verb",
					definition: "a verb with a special past form",
				},
			],
			practice: {
				recommendedExerciseTypes: [
					"fill_in_the_blank",
					"sentence_correction",
					"multiple_choice",
				],
				difficulty: "medium",
			},
		},
		lessonMatchers: [
			{ level: "A2", titleIncludes: "past simple", kind: "teach" },
		],
	},
	{
		slug: "articles-basics",
		title: "Articles: A, An, The",
		cefrLevel: "A1",
		category: "Nouns",
		summary: "Choose a, an, or the to make nouns clear and natural.",
		estimatedMinutes: 9,
		content: {
			description:
				"Articles help show whether a noun is general, specific, singular, or already known in the conversation.",
			objectives: [
				"Use a and an with singular countable nouns",
				"Use the for specific nouns",
			],
			rules: [
				{
					title: "Use a or an for one general thing",
					explanation:
						"Use a before consonant sounds and an before vowel sounds when something is singular and not specific yet.",
					formula: "a book / an apple",
					examples: [
						{ sentence: "I saw a dog in the park.", highlight: "a" },
						{ sentence: "She ate an orange.", highlight: "an" },
						{ sentence: "The dog was very friendly.", highlight: "The" },
					],
					commonMistakes: [
						{
							wrong: "an university",
							correct: "a university",
							why: "University starts with a consonant sound /ju:/.",
						},
						{
							wrong: "I bought book.",
							correct: "I bought a book.",
							why: "Singular countable nouns usually need an article.",
						},
					],
				},
			],
			vocabulary: [
				{ word: "specific", definition: "clearly identified" },
				{ word: "countable", definition: "something you can count" },
			],
			practice: {
				recommendedExerciseTypes: ["multiple_choice", "fill_in_the_blank"],
				difficulty: "easy",
			},
		},
		lessonMatchers: [{ level: "A1", titleIncludes: "article", kind: "teach" }],
	},
];

type CandidateLesson = {
	id: string;
	title: string;
	slug: string;
	unitSlug: string;
	level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
};

function normalizeText(value: string) {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
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

function matchesLesson(
	lesson: CandidateLesson,
	matcher: NonNullable<SeedTopic["lessonMatchers"]>[number],
) {
	if (matcher.level && matcher.level !== lesson.level) {
		return false;
	}

	if (
		matcher.unitSlug &&
		normalizeText(matcher.unitSlug) !== normalizeText(lesson.unitSlug)
	) {
		return false;
	}

	if (
		matcher.lessonSlug &&
		normalizeText(matcher.lessonSlug) !== normalizeText(lesson.slug)
	) {
		return false;
	}

	if (
		matcher.titleIncludes &&
		!normalizeText(lesson.title).includes(normalizeText(matcher.titleIncludes))
	) {
		return false;
	}

	return true;
}

function autoMatchLesson(topic: SeedTopic, lesson: CandidateLesson) {
	if (topic.cefrLevel !== lesson.level) {
		return false;
	}

	const topicSlug = normalizeText(topic.slug);
	const topicTitle = normalizeText(topic.title);
	const lessonSlug = normalizeText(lesson.slug);
	const lessonTitle = normalizeText(lesson.title);

	return (
		lessonSlug === topicSlug ||
		lessonTitle === topicSlug ||
		lessonTitle === topicTitle ||
		lessonTitle.includes(topicTitle)
	);
}

async function loadPublishedGrammarLessons(): Promise<CandidateLesson[]> {
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
			),
		);
}

async function main() {
	const lessons = await loadPublishedGrammarLessons();
	const knownSlugs = new Set(TOPICS.map((topic) => topic.slug));

	for (const topic of TOPICS) {
		await db
			.insert(grammarTopic)
			.values({
				id: makeTopicId(topic.slug),
				slug: topic.slug,
				title: topic.title,
				summary: topic.summary,
				cefrLevel: topic.cefrLevel,
				category: topic.category,
				estimatedMinutes: topic.estimatedMinutes,
				content: topic.content,
				isPublished: true,
				updatedAt: new Date(),
			})
			.onConflictDoUpdate({
				target: grammarTopic.slug,
				set: {
					id: makeTopicId(topic.slug),
					title: topic.title,
					summary: topic.summary,
					cefrLevel: topic.cefrLevel,
					category: topic.category,
					estimatedMinutes: topic.estimatedMinutes,
					content: topic.content,
					isPublished: true,
					updatedAt: new Date(),
				},
			});
	}

	await db.delete(grammarTopicRelation);
	await db.delete(lessonGrammarTopic);

	for (const topic of TOPICS) {
		for (const prerequisite of topic.prerequisites ?? []) {
			if (!knownSlugs.has(prerequisite)) continue;
			await db.insert(grammarTopicRelation).values({
				id: makeRelationId(topic.slug, prerequisite, "prerequisite"),
				fromTopicId: makeTopicId(topic.slug),
				toTopicId: makeTopicId(prerequisite),
				kind: "prerequisite",
			});
		}

		for (const relatedTopic of topic.relatedTopics ?? []) {
			if (!knownSlugs.has(relatedTopic)) continue;
			await db.insert(grammarTopicRelation).values({
				id: makeRelationId(topic.slug, relatedTopic, "related"),
				fromTopicId: makeTopicId(topic.slug),
				toTopicId: makeTopicId(relatedTopic),
				kind: "related",
			});
		}

		for (const nextTopic of topic.nextTopics ?? []) {
			if (!knownSlugs.has(nextTopic)) continue;
			await db.insert(grammarTopicRelation).values({
				id: makeRelationId(topic.slug, nextTopic, "next"),
				fromTopicId: makeTopicId(topic.slug),
				toTopicId: makeTopicId(nextTopic),
				kind: "next",
			});
		}
	}

	for (const topic of TOPICS) {
		const matchedLessons = new Map<
			string,
			{ lesson: CandidateLesson; kind: "teach" | "practice" | "review" }
		>();

		for (const matcher of topic.lessonMatchers ?? []) {
			for (const lesson of lessons) {
				if (!matchesLesson(lesson, matcher)) continue;
				matchedLessons.set(lesson.id, {
					lesson,
					kind: matcher.kind ?? "teach",
				});
			}
		}

		if (matchedLessons.size === 0) {
			for (const lesson of lessons) {
				if (!autoMatchLesson(topic, lesson)) continue;
				matchedLessons.set(lesson.id, { lesson, kind: "teach" });
			}
		}

		let sortOrder = 0;
		for (const { lesson, kind } of matchedLessons.values()) {
			await db.insert(lessonGrammarTopic).values({
				id: makeLessonTopicId(lesson.id, makeTopicId(topic.slug), kind),
				lessonId: lesson.id,
				grammarTopicId: makeTopicId(topic.slug),
				kind,
				sortOrder,
			});
			sortOrder += 1;
		}
	}

	console.log(
		`Seeded ${TOPICS.length} grammar topics and linked them to ${lessons.length} published grammar lessons.`,
	);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
