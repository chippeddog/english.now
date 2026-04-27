import { createOpenAI } from "@ai-sdk/openai";
import type { GrammarSessionItem } from "@english.now/db/schema/grammar";
import { env } from "@english.now/env/server";
import { generateText, Output } from "ai";
import { z } from "zod";

const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });

const freeAnswerGradeSchema = z.object({
	isCorrect: z.boolean(),
	normalizedAnswer: z.string(),
	feedback: z.string(),
	quality: z.number().int().min(0).max(5),
});

type GradeGrammarFreeAnswerInput = {
	item: GrammarSessionItem;
	userAnswer: string;
	nativeLanguage?: string | null;
};

export type GrammarFreeAnswerGrade = z.infer<typeof freeAnswerGradeSchema>;

export async function gradeGrammarFreeAnswer({
	item,
	userAnswer,
	nativeLanguage,
}: GradeGrammarFreeAnswerInput): Promise<GrammarFreeAnswerGrade> {
	const { output } = await generateText({
		model: openai("gpt-5.4-mini"),
		output: Output.object({ schema: freeAnswerGradeSchema }),
		temperature: 0.2,
		system: `You are grading an English grammar practice response.

Judge whether the learner answer is acceptable for the task.
- Be lenient about punctuation and minor wording changes.
- Only mark incorrect if the grammar target is wrong, incomplete, or the learner ignored the instruction.
- quality must be:
  - 5 for fully correct and natural
  - 4 for correct but slightly awkward
  - 2 for partly correct / major issue
  - 0 or 1 for incorrect
- feedback must be concise, constructive, and directly about the target grammar.
- If the learner's native language is not English (${nativeLanguage ?? "en"}), keep feedback in English. Translation is handled separately.`,
		prompt: `Task type: ${item.type}
Rule title: ${item.ruleTitle}
Prompt: ${item.prompt}
Instruction: ${item.instruction ?? "(none)"}
Model answer: ${
			Array.isArray(item.correctAnswer)
				? item.correctAnswer.join(" | ")
				: item.correctAnswer
		}
Target explanation: ${item.explanation}

Learner answer:
${userAnswer}`,
	});

	if (!output) {
		throw new Error("Failed to grade grammar answer");
	}

	return output;
}
