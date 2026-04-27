import { createOpenAI } from "@ai-sdk/openai";
import type {
	GrammarItemDifficulty,
	GrammarItemPhase,
	GrammarItemTranslation,
	GrammarItemType,
	GrammarSessionItem,
	GrammarTopic,
	GrammarTopicContent,
	GrammarTopicRule,
} from "@english.now/db/schema/grammar";
import { generateText, Output } from "ai";
import { z } from "zod";

const grammarItemSchema = z.object({
	phase: z.enum(["controlled", "semi", "freer"]),
	type: z.literal("multiple_choice"),
	difficulty: z.enum(["easy", "medium", "hard"]),
	prompt: z
		.string()
		.refine(
			(prompt) => prompt.includes("___") || prompt.includes("_____"),
			"Prompt must be a gap-fill sentence with a blank.",
		),
	instruction: z.string().nullable(),
	options: z.array(z.string()).length(4),
	items: z.null(),
	correctAnswer: z.string(),
	hint: z.string().nullable(),
	explanation: z.string(),
	ruleTitle: z.string(),
	l1: z
		.object({
			prompt: z.string().nullable(),
			hint: z.string().nullable(),
			explanation: z.string().nullable(),
			instruction: z.string().nullable(),
		})
		.nullable(),
});

const grammarDrillOutputSchema = z.object({
	selectedRuleTitles: z.array(z.string()).min(1).max(2),
	items: z.array(grammarItemSchema).min(3),
});

export type GrammarDifficultyMix = {
	controlled: number;
	semi: number;
	freer: number;
};

type GenerateGrammarDrillInput = {
	topic: Pick<GrammarTopic, "title" | "cefrLevel" | "category"> & {
		content: GrammarTopicContent;
	};
	nativeLanguage?: string | null;
	difficultyMix?: GrammarDifficultyMix;
	mode?: "full" | "practice_only";
};

type GeneratedGrammarDrill = {
	selectedRuleTitles: string[];
	items: GrammarSessionItem[];
};

function getOpenAI() {
	const apiKey = process.env.OPENAI_API_KEY;
	if (!apiKey) {
		throw new Error("OPENAI_API_KEY is required to generate grammar drills.");
	}

	return createOpenAI({ apiKey });
}

function serializeRules(rules: GrammarTopicRule[]) {
	return rules
		.map((rule) => {
			const examples = rule.examples
				.map(
					(example) =>
						`- ${example.sentence}${example.note ? ` (${example.note})` : ""}`,
				)
				.join("\n");
			const mistakes =
				rule.commonMistakes
					?.map(
						(mistake) =>
							`- Wrong: ${mistake.wrong} | Correct: ${mistake.correct} | Why: ${mistake.why}`,
					)
					.join("\n") ?? "None";

			return [
				`Rule: ${rule.title}`,
				`Plain rule: ${rule.ruleShort ?? rule.explanation}`,
				`Explanation: ${rule.explanation}`,
				rule.signal ? `Signal: ${rule.signal}` : null,
				rule.formula ? `Formula: ${rule.formula}` : null,
				"Examples:",
				examples || "- None",
				"Common mistakes:",
				mistakes,
			]
				.filter(Boolean)
				.join("\n");
		})
		.join("\n\n");
}

function normalizeItem(
	item: z.infer<typeof grammarItemSchema>,
): GrammarSessionItem {
	const translation: GrammarItemTranslation | undefined = item.l1
		? {
				prompt: item.l1.prompt ?? undefined,
				hint: item.l1.hint ?? undefined,
				explanation: item.l1.explanation ?? undefined,
				instruction: item.l1.instruction ?? undefined,
			}
		: undefined;

	return {
		id: crypto.randomUUID(),
		phase: item.phase as GrammarItemPhase,
		type: item.type as GrammarItemType,
		difficulty: item.difficulty as GrammarItemDifficulty,
		prompt: item.prompt,
		instruction: item.instruction ?? undefined,
		options: item.options && item.options.length > 0 ? item.options : undefined,
		correctAnswer: item.correctAnswer,
		hint: item.hint ?? undefined,
		ruleTitle: item.ruleTitle,
		explanation: item.explanation,
		l1: translation,
	};
}

function buildMixDescription(mix: GrammarDifficultyMix) {
	const total = mix.controlled + mix.semi + mix.freer;
	const safeTotal = total > 0 ? total : 1;

	return `Target phase mix for practice items:
- controlled: ${mix.controlled} (${Math.round((mix.controlled / safeTotal) * 100)}%)
- semi: ${mix.semi} (${Math.round((mix.semi / safeTotal) * 100)}%)
- freer: ${mix.freer} (${Math.round((mix.freer / safeTotal) * 100)}%)`;
}

export async function generateGrammarDrill({
	topic,
	nativeLanguage,
	difficultyMix = { controlled: 4, semi: 3, freer: 2 },
}: GenerateGrammarDrillInput): Promise<GeneratedGrammarDrill> {
	const rules = Array.isArray(topic.content.rules) ? topic.content.rules : [];
	if (rules.length === 0) {
		throw new Error("Grammar topic has no rules to generate from");
	}

	const practiceCount = Math.max(
		8,
		difficultyMix.controlled + difficultyMix.semi + difficultyMix.freer,
	);

	const systemPrompt = `You are an expert English grammar teacher building a premium grammar drill for a language-learning app.

Generate a cohesive drill for the topic "${topic.title}" (${topic.cefrLevel}, ${topic.category}).

Pedagogy requirements:
- Choose exactly 1 or 2 closely related rules from the provided topic content.
- Keep the drill focused on a single grammar idea, not the whole topic catalog.
- Use realistic, natural sentences and short scenarios.
- Every item must be unique.
- Always include at least one item grounded in a provided common mistake.
- Controlled items should be straightforward recognition checks.
- Semi-controlled items should require closer reading and comparison between similar gap-fill options.
- Freer items should use short contextual gap-fill scenarios, but still remain multiple choice for v0.

Item rules:
- Generate practice items only. Do not generate diagnose items.
- Every item must use type "multiple_choice".
- Provide exactly 4 options for every item.
- correctAnswer must be the exact correct option string.
- items must be null for every item.
- Generate only gap-fill multiple-choice tasks.
- prompt must contain a task label, a colon, and then a sentence with one or two "___" blanks.
- Good prompt examples:
  - "Choose the correct word: My sister ___ tea every morning."
  - "Choose the correct words: By the time we arrived, the movie ___ already ___."
- Do not generate correct-sentence choice tasks.
- Do not generate best-correction choice tasks.
- Do not generate prompts without a blank.
- Options must be only the missing word, phrase, or compact form pair. Do not use full sentence options.
- For multi-blank cloze prompts, use one "___" per blank and separate the matching option parts with " / " in the same order as the blanks.
- Keep options parallel: all options should have the same shape and similar length.
- Avoid trick answers that test vocabulary instead of the target grammar.

Feedback rules:
- explanation must be concise, warm, and educational (1-2 sentences).
- hint must be present for controlled and semi items, omitted for freer items.
- hint should nudge, not reveal.

Translation rules:
- The learner's native language is ${nativeLanguage ?? "en"}.
- If the native language is English, set l1 to null.
- If it is not English, translate prompt, hint, explanation, and instruction into the learner's native language.

Output requirements:
- Return exactly ${practiceCount} practice items.
- Do not return any item with phase "diagnose".
- Practice items must follow this phase distribution as closely as possible:
${buildMixDescription(difficultyMix)}
- Progress from easier to harder inside the practice section.
- Use the selected rule titles consistently in ruleTitle.`;

	const userPrompt = `Topic metadata:
Title: ${topic.title}
Level: ${topic.cefrLevel}
Category: ${topic.category}

Objectives:
${(topic.content.objectives ?? []).map((objective) => `- ${objective}`).join("\n")}

Rules:
${serializeRules(rules)}

Supporting vocabulary:
${
	(topic.content.vocabulary ?? [])
		.map(
			(item) =>
				`- ${item.word}${item.definition ? `: ${item.definition}` : ""}`,
		)
		.join("\n") || "- None"
}

Generate practice-only gap-fill multiple choice items for this topic. Every prompt must include one or two "___" blanks.`;

	const { output } = await generateText({
		model: getOpenAI()("gpt-5.4-mini"),
		output: Output.object({ schema: grammarDrillOutputSchema }),
		system: systemPrompt,
		prompt: userPrompt,
		temperature: 0.7,
	});

	if (!output) {
		throw new Error("Failed to generate grammar drill");
	}

	return {
		selectedRuleTitles: output.selectedRuleTitles,
		items: output.items.map(normalizeItem),
	};
}
