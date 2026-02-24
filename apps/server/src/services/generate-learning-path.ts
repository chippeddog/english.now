import {
	db,
	eq,
	learningPath,
	lesson,
	unit,
	userProfile,
	vocabularyPhrase,
	vocabularyWord,
} from "@english.now/db";
import type { LessonContent } from "@english.now/db";
import { generateText, Output } from "ai";
import { z } from "zod";
import { B1_CURRICULUM, type Curriculum } from "../curriculum/b1";
import { openai } from "../utils/ai";

// ─── Types ────────────────────────────────────────────────────────────────────

export type GenerationStep =
	| "outline"
	| "lessons"
	| "vocabulary"
	| "phrases"
	| "complete";

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const translationsSchema = z.object({
	translations: z.array(
		z.object({
			word: z.string(),
			translation: z.string(),
		}),
	),
});

const generatedVocabularySchema = z.object({
	words: z.array(
		z.object({
			word: z.string(),
			translation: z.string(),
			definition: z.string(),
			level: z.string(),
			category: z.string(),
			tags: z.array(z.string()),
		}),
	),
});

const generatedPhrasesSchema = z.object({
	phrases: z.array(
		z.object({
			phrase: z.string(),
			meaning: z.string(),
			exampleUsage: z.string(),
			category: z.string(),
			level: z.string(),
			literalTranslation: z.string(),
			tags: z.array(z.string()),
		}),
	),
});

// ─── Level Mapping ────────────────────────────────────────────────────────────

const LEVEL_TO_CEFR: Record<string, string> = {
	beginner: "A1",
	elementary: "A2",
	intermediate: "B1",
	"upper-intermediate": "B2",
	advanced: "C1",
};

const CURRICULUM_MAP: Record<string, Curriculum> = {
	B1: B1_CURRICULUM,
};

function getCurriculum(cefrLevel: string): Curriculum {
	return CURRICULUM_MAP[cefrLevel] ?? B1_CURRICULUM;
}

// ─── Main Generation Function ─────────────────────────────────────────────────

async function updateProgress(
	learningPathId: string,
	progress: number,
	message: string,
) {
	await db
		.update(learningPath)
		.set({ progress, progressMessage: message })
		.where(eq(learningPath.id, learningPathId));
}

export async function generateLearningPath(
	userId: string,
): Promise<{ learningPathId: string }> {
	const [profile] = await db
		.select()
		.from(userProfile)
		.where(eq(userProfile.userId, userId))
		.limit(1);

	if (!profile) {
		throw new Error("User profile not found");
	}

	const cefrLevel = LEVEL_TO_CEFR[profile.level ?? "intermediate"] ?? "B1";
	const goal = profile.goal ?? "general";
	const focusAreas = (profile.focusAreas ?? [
		"vocabulary",
		"grammar",
	]) as string[];
	const nativeLanguage = profile.nativeLanguage ?? "uk";
	const nativeLanguageName = getNativeLanguageName(nativeLanguage);

	const learningPathId = crypto.randomUUID();
	await db.insert(learningPath).values({
		id: learningPathId,
		userId,
		level: cefrLevel,
		goal,
		focusAreas,
		status: "generating",
		progress: 0,
		progressMessage: "Starting generation...",
	});

	try {
		// ── Step 1: Seed curriculum from template (instant, no AI) ──────────
		const curriculum = getCurriculum(cefrLevel);
		const savedUnits = await seedCurriculumFromTemplate(
			learningPathId,
			curriculum,
		);
		await updateProgress(learningPathId, 20, "Course structure created");

		// ── Step 2: Translate lesson vocabulary to native language ──────────
		await translateLessonVocabulary(savedUnits, nativeLanguageName);
		await updateProgress(learningPathId, 40, "Lesson content localized");

		// ── Step 3: Generate vocabulary ─────────────────────────────────────
		await generateAndSaveVocabulary(
			userId,
			cefrLevel,
			goal,
			nativeLanguageName,
		);
		await updateProgress(learningPathId, 70, "Vocabulary built");

		// ── Step 4: Generate phrases ────────────────────────────────────────
		await generateAndSavePhrases(userId, cefrLevel, goal, nativeLanguageName);

		// ── Mark complete ───────────────────────────────────────────────────
		await db
			.update(learningPath)
			.set({
				status: "ready",
				progress: 100,
				progressMessage: "Your learning path is ready!",
				generatedAt: new Date(),
			})
			.where(eq(learningPath.id, learningPathId));

		return { learningPathId };
	} catch (error) {
		await db
			.update(learningPath)
			.set({
				status: "failed",
				progressMessage:
					error instanceof Error ? error.message : "Generation failed",
			})
			.where(eq(learningPath.id, learningPathId));

		throw error;
	}
}

// ─── Step 1: Seed from Curriculum Template ────────────────────────────────────

type SavedUnit = {
	unitId: string;
	lessonIds: { id: string; wordsToLearn: { word: string }[] }[];
};

async function seedCurriculumFromTemplate(
	learningPathId: string,
	curriculum: Curriculum,
): Promise<SavedUnit[]> {
	const savedUnits: SavedUnit[] = [];

	for (let i = 0; i < curriculum.units.length; i++) {
		const u = curriculum.units[i];
		if (!u) continue;
		const unitId = crypto.randomUUID();

		await db.insert(unit).values({
			id: unitId,
			learningPathId,
			title: u.title,
			description: u.description,
			order: i + 1,
			status: i === 0 ? "active" : "locked",
			progress: 0,
		});

		const lessonEntries: SavedUnit["lessonIds"] = [];

		const lessonRows = u.lessons.map((l, j) => {
			const lessonId = crypto.randomUUID();
			lessonEntries.push({
				id: lessonId,
				wordsToLearn: l.content.wordsToLearn.map((w) => ({ word: w.word })),
			});
			return {
				id: lessonId,
				unitId,
				title: l.title,
				subtitle: l.subtitle,
				type: l.type,
				order: j + 1,
				status:
					i === 0 && j === 0
						? "current"
						: i === 0
							? "available"
							: "locked",
				progress: 0,
				content: l.content as LessonContent,
			};
		});

		await db.insert(lesson).values(lessonRows);
		savedUnits.push({ unitId, lessonIds: lessonEntries });
	}

	return savedUnits;
}

// ─── Step 2: Translate Lesson Vocabulary ──────────────────────────────────────

async function translateLessonVocabulary(
	savedUnits: SavedUnit[],
	nativeLanguageName: string,
): Promise<void> {
	const allWords: string[] = [];
	for (const u of savedUnits) {
		for (const l of u.lessonIds) {
			for (const w of l.wordsToLearn) {
				if (!allWords.includes(w.word)) {
					allWords.push(w.word);
				}
			}
		}
	}

	if (allWords.length === 0) return;

	const { output } = await generateText({
		model: openai("gpt-4o-mini"),
		output: Output.object({ schema: translationsSchema }),
		system: `Translate English words/phrases to ${nativeLanguageName}. Provide natural, commonly-used translations. Output valid JSON.`,
		prompt: `Translate these English words/phrases to ${nativeLanguageName}:\n${allWords.map((w) => `- ${w}`).join("\n")}`,
		temperature: 0.3,
	});

	if (!output) return;

	const translationMap = new Map<string, string>();
	for (const t of output.translations) {
		translationMap.set(t.word.toLowerCase(), t.translation);
	}

	for (const u of savedUnits) {
		for (const l of u.lessonIds) {
			if (l.wordsToLearn.length === 0) continue;

			const [existingLesson] = await db
				.select({ id: lesson.id, content: lesson.content })
				.from(lesson)
				.where(eq(lesson.id, l.id))
				.limit(1);

			if (!existingLesson?.content) continue;

			const content = existingLesson.content as LessonContent;
			const updatedWords = content.wordsToLearn.map((w) => ({
				...w,
				translation:
					translationMap.get(w.word.toLowerCase()) || w.translation,
			}));

			await db
				.update(lesson)
				.set({
					content: { ...content, wordsToLearn: updatedWords },
				})
				.where(eq(lesson.id, l.id));
		}
	}
}

// ─── Step 3: Vocabulary ───────────────────────────────────────────────────────

async function generateAndSaveVocabulary(
	userId: string,
	cefrLevel: string,
	goal: string,
	nativeLanguageName: string,
): Promise<void> {
	const systemPrompt = `You are an expert English vocabulary teacher. Generate a vocabulary list with simple, clear entries.

Your output must be valid JSON with this exact structure:
{
  "words": [
    {
      "word": "English word",
      "translation": "Translation in ${nativeLanguageName}",
      "definition": "Clear, concise definition",
      "level": "${cefrLevel}",
      "category": "Category name",
      "tags": ["tag1", "tag2"]
    }
  ]
}

Rules:
- Generate exactly 80 words
- Words must be appropriate for CEFR ${cefrLevel} level
- Include a mix of nouns, verbs, adjectives, and adverbs
- Categories should be diverse and relevant to the learning goal
- Translations must be in ${nativeLanguageName}
- Definitions should be concise (one sentence max)
- Each word needs at least 1 tag`;

	const userPrompt = `Generate 80 vocabulary words for an English learner at CEFR ${cefrLevel} level whose learning goal is "${goal}".

Include words from these categories:
- Everyday life & social situations
- ${goal}-specific vocabulary
- Common useful words for the level
- Action verbs and descriptive adjectives

The words should be practical and immediately useful.`;

	const { output: generated } = await generateText({
		model: openai("gpt-4o-mini"),
		output: Output.object({ schema: generatedVocabularySchema }),
		system: systemPrompt,
		prompt: userPrompt,
		temperature: 0.7,
	});

	if (!generated) {
		throw new Error("Failed to generate vocabulary");
	}

	const wordRows = generated.words.map((w) => ({
		id: crypto.randomUUID(),
		userId,
		word: w.word,
		translation: w.translation,
		definition: w.definition,
		level: w.level || cefrLevel,
		mastery: "new" as const,
		category: w.category,
		tags: w.tags,
		source: "generated" as const,
	}));

	for (let i = 0; i < wordRows.length; i += 50) {
		const batch = wordRows.slice(i, i + 50);
		await db.insert(vocabularyWord).values(batch);
	}
}

// ─── Step 4: Phrases ──────────────────────────────────────────────────────────

async function generateAndSavePhrases(
	userId: string,
	cefrLevel: string,
	goal: string,
	nativeLanguageName: string,
): Promise<void> {
	const systemPrompt = `You are an expert English teacher specializing in common phrases and expressions.

Your output must be valid JSON with this exact structure:
{
  "phrases": [
    {
      "phrase": "Common English phrase or expression",
      "meaning": "What the phrase means",
      "exampleUsage": "A natural dialog or sentence using the phrase",
      "category": "Category name",
      "level": "${cefrLevel}",
      "literalTranslation": "Word-by-word translation in ${nativeLanguageName}",
      "tags": ["tag1", "tag2"]
    }
  ]
}

Rules:
- Generate exactly 30 phrases
- Phrases must be appropriate for CEFR ${cefrLevel} level
- Include a mix of: greetings, small talk, opinions, requests, reactions, idioms
- Categories should group related phrases together
- Literal translations help learners understand word order differences
- Example usage should show the phrase in a natural context`;

	const userPrompt = `Generate 30 common English phrases and expressions for an English learner at CEFR ${cefrLevel} level whose learning goal is "${goal}".

Include phrases for:
- Daily conversations and small talk
- ${goal}-related situations
- Expressing opinions and feelings
- Making requests and suggestions
- Common reactions and responses

Phrases should be ones native speakers actually use frequently.`;

	const { output: generated } = await generateText({
		model: openai("gpt-4o-mini"),
		output: Output.object({ schema: generatedPhrasesSchema }),
		system: systemPrompt,
		prompt: userPrompt,
		temperature: 0.7,
	});

	if (!generated) {
		throw new Error("Failed to generate phrases");
	}

	const phraseRows = generated.phrases.map((p) => ({
		id: crypto.randomUUID(),
		userId,
		phrase: p.phrase,
		meaning: p.meaning,
		exampleUsage: p.exampleUsage,
		category: p.category,
		level: p.level || cefrLevel,
		mastery: "new" as const,
		literalTranslation: p.literalTranslation,
		tags: p.tags,
		source: "generated" as const,
	}));

	await db.insert(vocabularyPhrase).values(phraseRows);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getNativeLanguageName(code: string): string {
	const languages: Record<string, string> = {
		uk: "Ukrainian",
		en: "English",
		fr: "French",
		es: "Spanish",
		de: "German",
		pt: "Portuguese",
		it: "Italian",
		pl: "Polish",
		ja: "Japanese",
		ko: "Korean",
		zh: "Chinese",
		ar: "Arabic",
		hi: "Hindi",
		tr: "Turkish",
	};
	return languages[code] ?? "Ukrainian";
}
