import type {
	ConversationSessionContext,
	DailyConversationActivity,
} from "@english.now/db";
import { getConversationSessionMeta, normalizeConversationActivityPayload } from "./conversation-mode";

type SessionMeta = ReturnType<typeof getConversationSessionMeta>;

function formatGoals(goals: string[]) {
	return goals.map((goal) => `- ${goal}`).join("\n");
}

function buildModePromptSection(meta: SessionMeta) {
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

export function buildConversationSystemPrompt(meta: SessionMeta, level: string) {
	return [
		"You are helping someone practice spoken English.",
		`The learner is at a ${level} level.`,
		"Keep your language appropriate for their level.",
		"Be encouraging and supportive.",
		"Keep replies conversational and reasonably short.",
		"Give subtle, helpful corrections by modeling better English naturally in your response.",
		buildModePromptSection(meta),
		meta.goals.length > 0 ? `Session goals:\n${formatGoals(meta.goals)}` : null,
	].filter(Boolean).join("\n\n");
}

export function buildConversationGreeting(meta: SessionMeta, level: string) {
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

export function buildConversationHintSystemPrompt(input: {
	meta: SessionMeta;
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

export function buildConversationReviewGuidance(meta: SessionMeta) {
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

export function buildConversationSessionFromActivity(
	activity: DailyConversationActivity,
	level: string,
) {
	const normalized = normalizeConversationActivityPayload(activity.payload);
	const contextWithoutPrompt: ConversationSessionContext = {
		mode: normalized.mode,
		display: {
			title: normalized.title,
			subtitle: normalized.subtitle,
		},
		goals: normalized.goals,
		participants: normalized.participants,
		modeConfig: normalized.modeConfig,
		systemPrompt: "",
		scenarioDescription: normalized.subtitle,
		scenarioType: normalized.scenarioType,
		aiRole: normalized.participants.aiRole,
	};
	const meta = getConversationSessionMeta({
		scenario: normalized.title,
		mode: normalized.mode,
		context: contextWithoutPrompt,
	});
	const systemPrompt = buildConversationSystemPrompt(meta, level);
	const context: ConversationSessionContext = {
		...contextWithoutPrompt,
		systemPrompt,
	};

	return {
		mode: normalized.mode,
		scenario: {
			id: normalized.sourceId,
			name: normalized.title,
			description: normalized.subtitle,
			goals: normalized.goals,
		},
		sessionLabel: normalized.title,
		context,
		greeting: buildConversationGreeting(meta, level),
	};
}
