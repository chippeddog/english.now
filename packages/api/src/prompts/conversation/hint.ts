import { z } from "zod";
import type { ConversationSessionMeta } from "./types";

export const conversationHintPromptKey = "conversation-hint";
export const conversationHintPromptVersion = "1.0.0";
export const conversationHintModel = "gpt-4o-mini";
export const conversationHintTemperature = 0.7;

export const conversationHintSchema = z.object({
	text: z.string(),
	translation: z.string(),
});

export function buildConversationHintSystemPrompt(input: {
	meta: ConversationSessionMeta;
	level: string;
	nativeLanguage: string;
}) {
	const modeGuidance =
		input.meta.mode === "roleplay"
			? [
					"This session is a roleplay.",
					"Suggest exactly one realistic line the learner could say next inside the scenario.",
					`The assistant is playing ${input.meta.participants.aiRole}.`,
					`Scenario: ${input.meta.subtitle}`,
				].join("\n")
			: input.meta.mode === "mini-class"
				? [
						"This session is a mini-class.",
						"Suggest exactly one short learner response that fits the current exercise.",
						`Lesson focus: ${input.meta.subtitle}`,
					].join("\n")
				: [
						"This session is a general conversation.",
						"Suggest exactly one short, natural response that keeps the conversation flowing.",
						`Topic: ${input.meta.title}`,
					].join("\n");

	return [
		"You help English learners figure out what to say next in a conversation.",
		`The learner speaks ${input.nativeLanguage} and is at a ${input.level} English level.`,
		modeGuidance,
		"Keep the line appropriate for their level, natural in the conversation, and ready to speak out loud.",
		`Also provide a natural translation in ${input.nativeLanguage}.`,
		"Do not add explanations, labels, or extra alternatives.",
	].join("\n");
}
