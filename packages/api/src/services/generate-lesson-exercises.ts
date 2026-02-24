import { createOpenAI } from "@ai-sdk/openai";
import type { ExerciseItem, LessonContent } from "@english.now/db";
import { env } from "@english.now/env/server";
import { generateText, Output } from "ai";
import { z } from "zod";

const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });

const exercisesOutputSchema = z.object({
	exercises: z.array(
		z.object({
			type: z.enum(["multiple_choice", "fill_in_the_blank"]),
			prompt: z.string(),
			options: z.array(z.string()),
			correctAnswer: z.string(),
			explanation: z.string(),
		}),
	),
});

export async function generateLessonExercises(
	lessonTitle: string,
	lessonType: string,
	content: LessonContent,
	nativeLanguage: string,
): Promise<ExerciseItem[]> {
	const grammarContext =
		content.grammarPoints.length > 0
			? `Grammar points to test:\n${content.grammarPoints.map((g) => `- ${g.title}: ${g.description}`).join("\n")}`
			: "";

	const vocabContext =
		content.wordsToLearn.length > 0
			? `Vocabulary to test:\n${content.wordsToLearn.map((w) => `- ${w.word} (${w.translation})`).join("\n")}`
			: "";

	const exerciseCount =
		content.grammarPoints.length + content.wordsToLearn.length > 0
			? Math.min(
					10,
					Math.max(
						6,
						content.grammarPoints.length * 2 + content.wordsToLearn.length,
					),
				)
			: 8;

	const systemPrompt = `You are an expert English teacher creating interactive exercises for a language learning app.

Generate exactly ${exerciseCount} exercises for the lesson "${lessonTitle}" (type: ${lessonType}).

Rules:
- Mix "multiple_choice" and "fill_in_the_blank" types roughly equally
- For multiple_choice: provide exactly 4 options in the "options" array, one correct
- For fill_in_the_blank: set "options" to an empty array [], and the prompt must contain exactly one "___" where the answer goes
- Explanations should be concise (1-2 sentences) and educational, in English
- All exercises must be appropriate for B1 (intermediate) English learners
- Make exercises progressively harder
- Avoid trivially obvious answers
- For grammar exercises: test understanding of the rules, not just memorization
- For vocabulary exercises: test meaning, usage in context, and collocations
- Each exercise must have a unique, realistic scenario
- The student's native language is ${nativeLanguage} — keep this in mind for common mistakes`;

	const userPrompt = `Create ${exerciseCount} exercises for this lesson:

Lesson: "${lessonTitle}"
Type: ${lessonType}
Description: ${content.description}

${grammarContext}
${vocabContext}

Generate a good mix of multiple choice and fill-in-the-blank exercises.`;

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
		type: ex.type,
		prompt: ex.prompt,
		options: ex.options.length > 0 ? ex.options : undefined,
		correctAnswer: ex.correctAnswer,
		explanation: ex.explanation,
	}));
}
