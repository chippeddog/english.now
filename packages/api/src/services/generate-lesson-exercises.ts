import { createOpenAI } from "@ai-sdk/openai";
import type {
	CurriculumLessonContent,
	ExerciseItem,
	LessonExerciseType,
} from "@english.now/db";
import { env } from "@english.now/env/server";
import { generateText, Output } from "ai";
import { z } from "zod";

const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });

// ─── Exercise Type Config per Lesson Type ────────────────────────────────────

const EXERCISE_TYPES_BY_LESSON: Record<string, LessonExerciseType[]> = {
	grammar: [
		"multiple_choice",
		"fill_in_the_blank",
		"sentence_correction",
		"reorder_words",
		"error_identification",
		"sentence_transformation",
	],
	vocabulary: [
		"multiple_choice",
		"fill_in_the_blank",
		"word_matching",
		"synonym_antonym",
		"categorization",
	],
	reading: [
		"multiple_choice",
		"true_false",
		"comprehension",
		"fill_in_the_blank",
	],
	listening: [
		"multiple_choice",
		"true_false",
		"dictation",
		"fill_in_the_blank",
	],
	speaking: ["multiple_choice", "dialogue_completion", "fill_in_the_blank"],
	writing: [
		"sentence_building",
		"sentence_correction",
		"error_correction",
		"fill_in_the_blank",
	],
};

const FALLBACK_TYPES: LessonExerciseType[] = [
	"multiple_choice",
	"fill_in_the_blank",
];

// ─── Zod Schema ──────────────────────────────────────────────────────────────

const exercisesOutputSchema = z.object({
	exercises: z.array(
		z.object({
			type: z.enum([
				"multiple_choice",
				"fill_in_the_blank",
				"sentence_correction",
				"sentence_transformation",
				"reorder_words",
				"error_identification",
				"word_matching",
				"synonym_antonym",
				"categorization",
				"true_false",
				"comprehension",
				"dictation",
				"dialogue_completion",
				"sentence_building",
				"error_correction",
			]),
			phase: z.enum(["guided", "free"]),
			difficulty: z.enum(["easy", "medium", "hard"]),
			prompt: z.string(),
			instruction: z.string().nullable(),
			options: z.array(z.string()).nullable(),
			pairs: z
				.array(z.object({ left: z.string(), right: z.string() }))
				.nullable(),
			items: z.array(z.string()).nullable(),
			categories: z
				.array(z.object({ name: z.string(), items: z.array(z.string()) }))
				.nullable(),
			correctAnswer: z.union([z.string(), z.array(z.string())]),
			explanation: z.string(),
			hint: z.string().nullable(),
		}),
	),
});

// ─── Content Helpers ─────────────────────────────────────────────────────────

function buildContentContext(content: CurriculumLessonContent): string {
	const parts: string[] = [`Description: ${content.description}`];

	if (content.type === "grammar") {
		if (content.rules.length > 0) {
			parts.push(
				"Grammar rules to test:",
				...content.rules.map(
					(r) =>
						`- ${r.title}: ${r.explanation}${r.formula ? ` (${r.formula})` : ""}`,
				),
			);
		}
		if (content.vocabulary.length > 0) {
			parts.push(
				"Supporting vocabulary:",
				...content.vocabulary.map(
					(w) => `- ${w.word}${w.definition ? ` (${w.definition})` : ""}`,
				),
			);
		}
	} else if (content.type === "vocabulary") {
		parts.push(
			"Words to test:",
			...content.words.map(
				(w) =>
					`- ${w.word} (${w.pos ?? ""}): ${w.definition ?? ""}${w.collocations ? ` | collocations: ${w.collocations.join(", ")}` : ""}`,
			),
		);
		if (content.thematicGroup) {
			parts.push(`Thematic group: ${content.thematicGroup}`);
		}
	} else if (content.type === "reading") {
		parts.push(
			`Passage: "${content.passage.title}"`,
			content.passage.text.slice(0, 500) +
				(content.passage.text.length > 500 ? "..." : ""),
			`Comprehension focus: ${content.comprehensionFocus}`,
		);
		if (content.glossary.length > 0) {
			parts.push(
				"Glossary:",
				...content.glossary.map((g) => `- ${g.word}: ${g.definition}`),
			);
		}
	} else if (content.type === "listening") {
		parts.push(
			`Audio script: ${content.audioScript.slice(0, 400)}...`,
			`Listening focus: ${content.listeningFocus}`,
		);
	} else if (content.type === "speaking") {
		if (content.usefulPhrases.length > 0) {
			parts.push(
				"Phrases to test:",
				...content.usefulPhrases.map((p) => `- "${p.phrase}" (${p.usage})`),
			);
		}
	} else if (content.type === "writing") {
		parts.push(
			`Writing type: ${content.writingType}`,
			`Useful expressions: ${content.usefulExpressions.join(", ")}`,
		);
	}

	return parts.join("\n");
}

function getExerciseCount(content: CurriculumLessonContent): number {
	let base = 8;
	if (content.type === "grammar") {
		base = content.rules.length * 2 + (content.vocabulary?.length ?? 0);
	} else if (content.type === "vocabulary") {
		base = content.words.length * 2;
	}
	return Math.min(12, Math.max(6, base));
}

// ─── Main Generator ──────────────────────────────────────────────────────────

export async function generateLessonExercises(
	lessonTitle: string,
	lessonType: string,
	content: CurriculumLessonContent,
	nativeLanguage: string,
): Promise<ExerciseItem[]> {
	const contentContext = buildContentContext(content);
	const exerciseCount = getExerciseCount(content);
	const guidedCount = Math.ceil(exerciseCount * 0.4);
	const freeCount = exerciseCount - guidedCount;

	const allowedTypes =
		EXERCISE_TYPES_BY_LESSON[content.type ?? lessonType] ?? FALLBACK_TYPES;
	const allowedTypesStr = allowedTypes.join(", ");

	const typeInstructions = buildTypeInstructions(content.type ?? lessonType);

	const systemPrompt = `You are an expert English teacher creating interactive exercises for a language learning app.

Generate exactly ${exerciseCount} exercises for the lesson "${lessonTitle}" (type: ${content.type ?? lessonType}).

EXERCISE PHASES:
- First ${guidedCount} exercises should have phase "guided" — these are easier, include hints, and target basic understanding
- Last ${freeCount} exercises should have phase "free" — these are harder, no hints, and test deeper application

DIFFICULTY:
- Guided exercises: "easy" or "medium"
- Free exercises: "medium" or "hard"
- Progress from easier to harder within each phase

ALLOWED EXERCISE TYPES: ${allowedTypesStr}
Use a good variety from the allowed types.

${typeInstructions}

EXERCISE TYPE RULES:
- multiple_choice: provide exactly 4 "options", one correct. correctAnswer is the correct option string.
- fill_in_the_blank: "options" must be empty/absent. Prompt must contain exactly one "___". correctAnswer is the word/phrase.
- sentence_correction: prompt contains an incorrect sentence. correctAnswer is the full corrected sentence.
- sentence_transformation: prompt asks to transform a sentence. correctAnswer is the transformed sentence.
- reorder_words: provide scrambled words in "items" array. correctAnswer is the words joined with spaces in correct order.
- error_identification: prompt is a sentence with an error. "options" are sentence segments. correctAnswer is the segment with the error.
- word_matching: provide "pairs" array with {left, right}. correctAnswer is "left1:right1,left2:right2,...".
- synonym_antonym: provide 4 "options". correctAnswer is the correct synonym/antonym.
- categorization: provide "categories" with {name, items:[]} and "items" to sort. correctAnswer is "cat1:item1,item2|cat2:item3,item4".
- true_false: prompt is a statement. correctAnswer is "True" or "False".
- comprehension: a question about a passage. 4 "options". correctAnswer is the correct option.
- dictation: prompt describes what to listen for. correctAnswer is the exact sentence.
- dialogue_completion: prompt is partial dialogue. 4 "options" for the missing line. correctAnswer is the correct option.
- sentence_building: prompt gives instructions. "items" are suggested words. correctAnswer is an example correct sentence.
- error_correction: prompt contains an error. correctAnswer is the corrected version.

GENERAL RULES:
- Explanations should be concise (1-2 sentences) and educational
- Each exercise must have a unique scenario
- Hints (for guided phase only) should nudge toward the answer without giving it away
- The student's native language is ${nativeLanguage}
- Set "instruction" to a short user-facing instruction if the exercise type label doesn't suffice`;

	const userPrompt = `Create ${exerciseCount} exercises for this lesson:

Lesson: "${lessonTitle}"
Type: ${content.type ?? lessonType}

${contentContext}

Generate a good variety of exercise types from: ${allowedTypesStr}`;

	const { output } = await generateText({
		model: openai("gpt-4o-mini"),
		output: Output.object({ schema: exercisesOutputSchema }),
		system: systemPrompt,
		prompt: userPrompt,
		temperature: 0.7,
	});

	if (!output) {
		throw new Error("Failed to generate exercises");
	}

	return output.exercises.map((ex) => ({
		id: crypto.randomUUID(),
		type: ex.type as LessonExerciseType,
		phase: ex.phase,
		difficulty: ex.difficulty,
		prompt: ex.prompt,
		instruction: ex.instruction ?? undefined,
		options: ex.options && ex.options.length > 0 ? ex.options : undefined,
		pairs: ex.pairs && ex.pairs.length > 0 ? ex.pairs : undefined,
		items: ex.items && ex.items.length > 0 ? ex.items : undefined,
		categories:
			ex.categories && ex.categories.length > 0 ? ex.categories : undefined,
		correctAnswer: ex.correctAnswer,
		explanation: ex.explanation,
		hint: ex.hint ?? undefined,
	}));
}

function buildTypeInstructions(lessonType: string): string {
	switch (lessonType) {
		case "grammar":
			return `GRAMMAR LESSON FOCUS:
- Test understanding of grammar rules, not just memorization
- Include sentence correction and transformation exercises
- Use realistic, natural-sounding sentences
- Test both recognition and production of correct forms`;

		case "vocabulary":
			return `VOCABULARY LESSON FOCUS:
- Test meaning, usage in context, and collocations
- Include word matching and categorization exercises
- Test both recognition (multiple choice) and production (fill in blank)
- Use words in realistic sentences, not isolation`;

		case "reading":
			return `READING LESSON FOCUS:
- Test comprehension of the passage (main idea, details, inference)
- Include true/false statements about the passage
- Test vocabulary in context from the passage
- Questions should require actually understanding the text`;

		case "listening":
			return `LISTENING LESSON FOCUS:
- Include dictation exercises
- Test comprehension of audio content
- Include detail-oriented questions
- Test ability to catch specific information`;

		case "speaking":
			return `SPEAKING LESSON FOCUS:
- Test knowledge of useful phrases and dialogue patterns
- Include dialogue completion exercises
- Test appropriate responses in conversational contexts
- Focus on functional language use`;

		case "writing":
			return `WRITING LESSON FOCUS:
- Test sentence construction and structure
- Include sentence building with given words
- Test error correction in written text
- Focus on the writing type being taught`;

		default:
			return "";
	}
}
