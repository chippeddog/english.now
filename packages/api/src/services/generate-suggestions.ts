import { createOpenAI } from "@ai-sdk/openai";
import type { ConversationRoleplay, ConversationTopic } from "@english.now/db";
import { env } from "@english.now/env/server";
import { generateText, Output } from "ai";
import { z } from "zod";

const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });

const suggestionsSchema = z.object({
	topics: z.array(
		z.object({
			id: z.string().describe("kebab-case unique identifier"),
			name: z.string().describe("Short display name (1 word max)"),
			icon: z.string().describe("Single emoji that represents the topic"),
			description: z
				.string()
				.describe("One sentence describing what you will discuss"),
		}),
	),
	roleplays: z.array(
		z.object({
			id: z.string().describe("kebab-case unique identifier"),
			name: z.string().describe("Short display name (2-3 words max)"),
			icon: z.string().describe("Single emoji that represents the scenario"),
			description: z
				.string()
				.describe("One sentence describing the roleplay scenario"),
			aiRole: z
				.string()
				.describe(
					"The role the AI will play, e.g. 'waiter', 'hotel receptionist'",
				),
		}),
	),
});

export async function generateSuggestions(profile: {
	level: string | null;
	interests: string[] | null;
	focusAreas: string[] | null;
	goal: string | null;
	nativeLanguage: string | null;
}): Promise<{
	topics: ConversationTopic[];
	roleplays: ConversationRoleplay[];
}> {
	const level = profile.level || "beginner";
	const interests = profile.interests?.length
		? profile.interests.join(", ")
		: "general topics";
	const focusAreas = profile.focusAreas?.length
		? profile.focusAreas.join(", ")
		: "general English";
	const goal = profile.goal || "improve English skills";
	const nativeLanguage = profile.nativeLanguage || "unknown";

	const levelGuidance =
		level === "beginner"
			? "keep scenarios simple and familiar (ordering food, basic greetings, shopping)"
			: level === "intermediate"
				? "include moderately challenging scenarios (negotiations, debates, presentations)"
				: "include complex scenarios (business negotiations, academic discussions, nuanced social situations)";

	const systemPrompt = `You are an expert English language tutor creating personalized conversation practice materials.

Generate topics and roleplays specifically tailored to this learner:
- English level: ${level}
- Interests: ${interests}
- Focus areas: ${focusAreas}
- Learning goal: ${goal}
- Native language: ${nativeLanguage}

Rules:
- Generate exactly 6 topics and 4 roleplays
- Topics should be casual discussion subjects the learner would enjoy based on their interests
- Each topic must include a short description explaining what you'll discuss
- Roleplays should be practical real-world scenarios relevant to their goals and level
- For ${level} level: ${levelGuidance}
- Each ID must be unique and in kebab-case
- Icons must be a single emoji character
- Make suggestions feel fresh and varied — avoid generic defaults unless they match the learner's interests
- Roleplay descriptions should set up a clear, engaging situation
- The aiRole should be a specific character (e.g., "hotel receptionist", "tech support agent")`;

	const { output } = await generateText({
		model: openai("gpt-4o-mini"),
		output: Output.object({ schema: suggestionsSchema }),
		system: systemPrompt,
		prompt: `Generate 6 personalized conversation topics and 4 roleplay scenarios for this English learner. Make them engaging, relevant to their interests (${interests}), and appropriate for their ${level} level.`,
		temperature: 0.9,
	});

	if (!output) {
		throw new Error("Failed to generate conversation suggestions");
	}

	return { topics: output.topics, roleplays: output.roleplays };
}
