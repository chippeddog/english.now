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

	if (meta.mode === "phone-call") {
		const topic =
			meta.modeConfig.kind === "phone-call" ? meta.modeConfig.topic : null;

		return [
			"Session context:",
			"- Mode: live spoken phone call with an English tutor",
			`- Tutor: ${meta.participants.aiRole}`,
			`- Topic: ${topic ?? "open small talk"}`,
			"- Learner turns are automatic speech transcripts. Ignore punctuation, capitalization, filler words (um, uh, like), and false starts.",
			"- Do not flag likely speech-recognition artifacts; focus on grammar and word choice that would sound wrong when spoken.",
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
