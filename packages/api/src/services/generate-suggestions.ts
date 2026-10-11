import type { ConversationRoleplay, ConversationTopic } from "@english.now/db";
import { generateText, Output } from "ai";
import { openai } from "../ai/providers";
import { buildAiTelemetry } from "../ai/telemetry";
import {
	buildConversationSuggestionsPrompt,
	conversationSuggestionsModel,
	conversationSuggestionsPromptKey,
	conversationSuggestionsPromptVersion,
	conversationSuggestionsSchema,
	conversationSuggestionsTemperature,
} from "../prompts/conversation-suggestions";

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

	const prompt = buildConversationSuggestionsPrompt({
		level,
		interests,
		focusAreas,
		goal,
		nativeLanguage,
	});

	const { output } = await generateText({
		model: openai(conversationSuggestionsModel),
		output: Output.object({ schema: conversationSuggestionsSchema }),
		system: prompt.system,
		prompt: prompt.user,
		temperature: conversationSuggestionsTemperature,
		experimental_telemetry: buildAiTelemetry({
			functionId: conversationSuggestionsPromptKey,
			metadata: {
				feature: "conversation",
				promptKey: conversationSuggestionsPromptKey,
				promptVersion: conversationSuggestionsPromptVersion,
				model: conversationSuggestionsModel,
				level,
				nativeLanguage,
			},
		}),
	});

	if (!output) {
		throw new Error("Failed to generate conversation suggestions");
	}

	return { topics: output.topics, roleplays: output.roleplays };
}
