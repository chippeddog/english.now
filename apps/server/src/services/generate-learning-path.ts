import {
	db,
	eq,
	learningPath,
	lesson,
	unit,
	userProfile,
} from "@english.now/db";
import type { LessonContent } from "@english.now/db";
import { generateText, Output } from "ai";
import { z } from "zod";
import { B1_CURRICULUM, type Curriculum } from "../curriculum/b1";
import { openai } from "../utils/ai";

// ─── Types ────────────────────────────────────────────────────────────────────

export type GenerationStep = "outline" | "lessons" | "complete";

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const translationsSchema = z.object({
	translations: z.array(
		z.object({
			word: z.string(),
			translation: z.string(),
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
		await updateProgress(learningPathId, 50, "Course structure created");

		// ── Step 2: Translate lesson vocabulary to native language ──────────
		await translateLessonVocabulary(savedUnits, nativeLanguageName);

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
