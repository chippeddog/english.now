import type { ConversationSessionMeta } from "./types";

export const conversationSystemPromptKey = "conversation-system";
export const conversationSystemPromptVersion = "1.0.0";
export const conversationSystemModel = "gpt-4o-mini";

function formatGoals(goals: string[]) {
	return goals.map((goal) => `- ${goal}`).join("\n");
}

function buildModePromptSection(meta: ConversationSessionMeta) {
	if (meta.mode === "roleplay") {
		const objective =
			meta.modeConfig.kind === "roleplay"
				? meta.modeConfig.objective
				: meta.subtitle;
		const successCriteria =
			meta.modeConfig.kind === "roleplay"
				? meta.modeConfig.successCriteria
				: [];

		return [
			"Mode: roleplay.",
			`Stay in character as the ${meta.participants.aiRole}.`,
			`Scenario: ${meta.subtitle}`,
			`Objective: ${objective}`,
			meta.participants.userRole
				? `The learner is playing the role of ${meta.participants.userRole}.`
				: null,
			successCriteria.length > 0
				? `Success criteria:\n${successCriteria.map((item: string) => `- ${item}`).join("\n")}`
				: null,
			"Keep the exchange realistic, practical, and grounded in the scenario.",
			"Do not drift into generic discussion unless the learner clearly changes the topic.",
		]
			.filter(Boolean)
			.join("\n");
	}

	if (meta.mode === "mini-class") {
		const objective =
			meta.modeConfig.kind === "mini-class"
				? meta.modeConfig.objective
				: meta.subtitle;
		const steps =
			meta.modeConfig.kind === "mini-class" ? meta.modeConfig.steps : [];

		return [
			"Mode: mini-class.",
			"You are a supportive English coach leading a short interactive lesson.",
			`Lesson objective: ${objective}`,
			steps.length > 0
				? `Lesson steps:\n${steps.map((step: string) => `- ${step}`).join("\n")}`
				: null,
			"Alternate between teaching briefly, checking understanding, and guided practice.",
		]
			.filter(Boolean)
			.join("\n");
	}

	return [
		"Mode: general conversation.",
		`Act as a friendly ${meta.participants.aiRole}.`,
		`Topic: ${meta.title}`,
		`Focus: ${meta.subtitle}`,
		"Keep the exchange open-ended and natural.",
		"Ask follow-up questions that invite opinions, experiences, or examples.",
	].join("\n");
}

export function buildFallbackConversationSystemPrompt(level: string) {
	return [
		`You are a friendly English conversation partner helping someone practice English at a ${level} level.`,
		"Be encouraging, keep the conversation going, and gently model better phrasing when the learner makes a clear mistake.",
		"Keep your replies natural, conversational, and not too long.",
	].join("\n");
}

export function buildConversationSystemPrompt(
	meta: ConversationSessionMeta,
	level: string,
) {
	return [
		"You are helping someone practice spoken English.",
		`The learner is at a ${level} level.`,
		"Keep your language appropriate for their level.",
		"Be encouraging and supportive.",
		"Keep replies conversational and reasonably short.",
		"Give subtle, helpful corrections by modeling better English naturally in your response.",
		buildModePromptSection(meta),
		meta.goals.length > 0 ? `Session goals:\n${formatGoals(meta.goals)}` : null,
	]
		.filter(Boolean)
		.join("\n\n");
}

export function buildConversationGreeting(
	meta: ConversationSessionMeta,
	level: string,
) {
	if (meta.mode === "roleplay") {
		const promptToStart =
			meta.modeConfig.kind === "roleplay" &&
			meta.modeConfig.suggestedIntents.length > 0
				? ` You can start by ${meta.modeConfig.suggestedIntents[0]}.`
				: "";

		if (level === "advanced") {
			return `Hello. I'm the ${meta.participants.aiRole} in this roleplay. ${meta.subtitle} Whenever you're ready, begin.${promptToStart}`;
		}

		return `Hi! I'm the ${meta.participants.aiRole} in this roleplay. ${meta.subtitle} Start when you're ready.${promptToStart}`;
	}

	if (meta.mode === "mini-class") {
		return `Hi! Today we'll work on ${meta.title}. ${meta.subtitle} Let's begin with a quick warm up.`;
	}

	if (level === "advanced") {
		return `Hi! I'm your ${meta.participants.aiRole} today. Let's dive into ${meta.title}. ${meta.subtitle} What do you think?`;
	}

	return `Hello! I'm your ${meta.participants.aiRole} today. Let's talk about ${meta.title}. ${meta.subtitle}`;
}
