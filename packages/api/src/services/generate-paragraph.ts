import { createOpenAI } from "@ai-sdk/openai";
import type { CefrLevel, ParagraphItem } from "@english.now/db";
import { env } from "@english.now/env/server";
import { generateText, Output } from "ai";
import { z } from "zod";
import { CEFR_PRONUACIATION_CONFIG, pickRandom } from "../lib/cefr";

const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });

export const paragraphSchema = z.object({
	text: z.string(),
	topic: z.string(),
	focusAreas: z.array(z.string()),
	tips: z.string(),
});

export async function generateParagraph(
	level: CefrLevel,
	interests?: string[],
): Promise<ParagraphItem> {
	const config = CEFR_PRONUACIATION_CONFIG[level];
	const [minWords, maxWords] = config.wordRange;

	const style = pickRandom(config.styles);
	const topic = pickRandom(config.topics);
	const genre = pickRandom(config.genres);

	const interestContext =
		interests && interests.length > 0
			? `The learner is interested in: ${interests.join(", ")}. Blend one of these interests into the topic if it fits naturally — otherwise stick with the assigned topic.`
			: "";

	const { output } = await generateText({
		model: openai("gpt-4o-mini"),
		output: Output.object({ schema: paragraphSchema }),
		system: `You are an expert English pronunciation coach creating read-aloud practice paragraphs.

Generate a single coherent paragraph for CEFR level ${level}.

TOPIC: ${topic}
GENRE: Write it as ${genre}.
STYLE: ${style}

Requirements:
- Word count: ${minWords}-${maxWords} words (STRICT — count carefully)
- The paragraph should flow naturally and be genuinely interesting to read aloud
- Include a variety of pronunciation challenges appropriate for the level (vowel sounds, consonant clusters, word stress, linking sounds, intonation patterns)
- The focusAreas should list 2-3 specific pronunciation features present in the paragraph
- The tips should give 1-2 practical pronunciation tips for reading this paragraph well
- Be creative and specific — use vivid details, names, places, or scenarios to make the text feel fresh and unique every time

${interestContext}`,
		prompt: `Write a fresh, unique read-aloud practice paragraph about "${topic}" in the style of ${genre}. CEFR level ${level}. Surprise me — avoid clichés and generic openings.`,
		temperature: 0.95,
	});

	if (!output) throw new Error("Failed to generate paragraph");

	const wordCount = output.text.split(/\s+/).length;

	return {
		text: output.text,
		topic: output.topic,
		cefrLevel: level,
		wordCount,
		focusAreas: output.focusAreas,
		tips: output.tips,
	};
}
