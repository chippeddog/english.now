import type {
	ConversationPracticeMode,
	ConversationScenarioType,
	ConversationSession,
	ConversationSessionContext,
	ConversationSessionDisplay,
	ConversationSessionModeConfig,
	ConversationSessionParticipants,
	DailyConversationActivity,
} from "@english.now/db";

export const DEFAULT_CONVERSATION_AI_ROLE = "conversation partner";

type ConversationActivityPayload = DailyConversationActivity["payload"];

export type NormalizedConversationActivityPayload = {
	sourceId: string;
	title: string;
	subtitle: string;
	mode: ConversationPracticeMode;
	scenarioType: ConversationScenarioType;
	participants: ConversationSessionParticipants;
	goals: string[];
	modeConfig: ConversationSessionModeConfig;
};

export type ConversationSessionMeta = {
	mode: ConversationPracticeMode;
	scenarioType: ConversationScenarioType;
	display: ConversationSessionDisplay;
	title: string;
	subtitle: string;
	participants: ConversationSessionParticipants;
	goals: string[];
	modeConfig: ConversationSessionModeConfig;
	systemPrompt?: string;
};

function compactStrings(values: Array<string | null | undefined>) {
	return values.map((value) => value?.trim()).filter(Boolean) as string[];
}

function conversationScenarioTypeToMode(
	scenarioType?: ConversationScenarioType | null,
): ConversationPracticeMode {
	return scenarioType === "roleplay" ? "roleplay" : "general-conversation";
}

function conversationModeToScenarioType(
	mode?: ConversationPracticeMode | null,
): ConversationScenarioType {
	return mode === "roleplay" ? "roleplay" : "topic";
}

export function getConversationModeLabel(mode: ConversationPracticeMode) {
	switch (mode) {
		case "roleplay":
			return "Roleplay";
		case "mini-class":
			return "Mini-class";
		default:
			return "Conversation";
	}
}

export function resolveConversationActivityMode(
	payload: Pick<ConversationActivityPayload, "mode" | "scenarioType">,
): ConversationPracticeMode {
	return payload.mode ?? conversationScenarioTypeToMode(payload.scenarioType);
}

export function buildDefaultConversationGoals(input: {
	mode: ConversationPracticeMode;
	title: string;
}) {
	switch (input.mode) {
		case "roleplay":
			return [
				"Stay in character and respond naturally",
				"Complete the scenario clearly",
				"Use practical everyday English",
			];
		case "mini-class":
			return [
				"Follow the lesson steps",
				"Practice the target skill aloud",
				"Use the new language in context",
			];
		default:
			return [
				`Practice ${input.title}-related vocabulary`,
				"Build conversational confidence",
				"Learn natural expressions",
			];
	}
}

export function buildDefaultConversationModeConfig(input: {
	mode: ConversationPracticeMode;
	sourceId: string;
	subtitle: string;
	userRole?: string | null;
}) {
	switch (input.mode) {
		case "roleplay":
			return {
				kind: "roleplay" as const,
				scenarioId: input.sourceId,
				objective: input.subtitle,
				successCriteria: [
					"State what you need clearly",
					"Respond to follow-up questions naturally",
					"Finish the exchange with confidence",
				],
				suggestedIntents: ["ask", "clarify", "confirm", "respond"],
			};
		case "mini-class":
			return {
				kind: "mini-class" as const,
				objective: input.subtitle,
				steps: ["Warm up", "Guided practice", "Wrap up"],
				...(input.sourceId ? { lessonId: input.sourceId } : {}),
			};
		default:
			return {
				kind: "general-conversation" as const,
				topicId: input.sourceId,
			};
	}
}

export function normalizeConversationActivityPayload(
	payload: ConversationActivityPayload,
): NormalizedConversationActivityPayload {
	const mode = resolveConversationActivityMode(payload);
	const participants: ConversationSessionParticipants = {
		aiRole: payload.aiRole ?? DEFAULT_CONVERSATION_AI_ROLE,
		...(payload.userRole !== undefined ? { userRole: payload.userRole } : {}),
	};
	const goals =
		payload.goals && payload.goals.length > 0
			? compactStrings(payload.goals)
			: buildDefaultConversationGoals({
					mode,
					title: payload.scenarioName,
				});
	const modeConfig =
		payload.modeConfig ??
		buildDefaultConversationModeConfig({
			mode,
			sourceId: payload.scenario,
			subtitle: payload.scenarioDescription,
			userRole: payload.userRole,
		});

	return {
		sourceId: payload.scenario,
		title: payload.scenarioName,
		subtitle: payload.scenarioDescription,
		mode,
		scenarioType: conversationModeToScenarioType(mode),
		participants,
		goals,
		modeConfig,
	};
}

export function getConversationSessionMeta(
	session: Pick<ConversationSession, "scenario" | "mode" | "context">,
): ConversationSessionMeta {
	const context = (session.context ?? null) as ConversationSessionContext | null;
	const mode =
		context?.mode ??
		session.mode ??
		conversationScenarioTypeToMode(context?.scenarioType);
	const title = context?.display?.title ?? session.scenario;
	const subtitle =
		context?.display?.subtitle ?? context?.scenarioDescription ?? "";
	const participants: ConversationSessionParticipants = {
		aiRole:
			context?.participants?.aiRole ??
			context?.aiRole ??
			DEFAULT_CONVERSATION_AI_ROLE,
		...(context?.participants?.userRole !== undefined
			? { userRole: context.participants.userRole }
			: {}),
	};
	const goals =
		context?.goals && context.goals.length > 0
			? compactStrings(context.goals)
			: buildDefaultConversationGoals({ mode, title });
	const modeConfig =
		context?.modeConfig ??
		buildDefaultConversationModeConfig({
			mode,
			sourceId: session.scenario,
			subtitle,
			userRole: participants.userRole,
		});
	const scenarioType =
		context?.scenarioType ?? conversationModeToScenarioType(mode);

	return {
		mode,
		scenarioType,
		display: {
			title,
			subtitle,
		},
		title,
		subtitle,
		participants,
		goals,
		modeConfig,
		systemPrompt: context?.systemPrompt,
	};
}
