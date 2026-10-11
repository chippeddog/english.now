import { z } from "zod";

export const conversationSuggestionsPromptKey = "conversation-suggestions";
export const conversationSuggestionsPromptVersion = "1.0.0";
export const conversationSuggestionsModel = "gpt-4o-mini";
export const conversationSuggestionsTemperature = 0.9;

export const conversationSuggestionsSchema = z.object({
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

export type ConversationSuggestionsPromptInput = {
	level: string;
	interests: string;
	focusAreas: string;
	goal: string;
	nativeLanguage: string;
};

export function buildConversationSuggestionsPrompt(
	input: ConversationSuggestionsPromptInput,
) {
	const levelGuidance =
		input.level === "beginner"
			? "keep scenarios simple and familiar (ordering food, basic greetings, shopping)"
			: input.level === "intermediate"
				? "include moderately challenging scenarios (negotiations, debates, presentations)"
				: "include complex scenarios (business negotiations, academic discussions, nuanced social situations)";

	const system = `You are an expert English language tutor creating personalized conversation practice materials.

Generate topics and roleplays specifically tailored to this learner:
- English level: ${input.level}
- Interests: ${input.interests}
- Focus areas: ${input.focusAreas}
- Learning goal: ${input.goal}
- Native language: ${input.nativeLanguage}

Rules:
- Generate exactly 6 topics and 4 roleplays
- Topics should be casual discussion subjects the learner would enjoy based on their interests
- Each topic must include a short description explaining what you'll discuss
- Roleplays should be practical real-world scenarios relevant to their goals and level
- For ${input.level} level: ${levelGuidance}
- Each ID must be unique and in kebab-case
- Icons must be a single emoji character
- Make suggestions feel fresh and varied — avoid generic defaults unless they match the learner's interests
- Roleplay descriptions should set up a clear, engaging situation
- The aiRole should be a specific character (e.g., "hotel receptionist", "tech support agent")`;

	const user = `Generate 6 personalized conversation topics and 4 roleplay scenarios for this English learner. Make them engaging, relevant to their interests (${input.interests}), and appropriate for their ${input.level} level.`;

	return { system, user };
}
