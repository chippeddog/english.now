import type { ConversationSessionMeta } from "./types";

export const conversationReviewGuidancePromptKey =
	"conversation-review-guidance";
export const conversationReviewGuidancePromptVersion = "1.0.0";

export function buildConversationReviewGuidance(meta: ConversationSessionMeta) {
	if (meta.mode === "roleplay") {
		const objective =
			meta.modeConfig.kind === "roleplay"
				? meta.modeConfig.objective
				: meta.subtitle;

		return [
			"Session context:",
			"- Mode: roleplay",
			`- Assistant role: ${meta.participants.aiRole}`,
			`- Scenario: ${meta.subtitle}`,
			`- Learner objective: ${objective}`,
			"- Prefer grammar and vocabulary corrections that sound natural for completing this scenario.",
			"- When there are multiple valid rewrites, prefer the one that would help the learner succeed in the scene.",
		].join("\n");
	}

	if (meta.mode === "mini-class") {
		return [
			"Session context:",
			"- Mode: mini-class",
			`- Lesson focus: ${meta.subtitle}`,
			"- Prefer corrections that support the lesson objective and spoken practice.",
		].join("\n");
	}

	return [
		"Session context:",
		"- Mode: general conversation",
		`- Topic: ${meta.title}`,
		`- Focus: ${meta.subtitle}`,
		"- Prefer natural, conversational corrections that fit an open discussion.",
	].join("\n");
}
