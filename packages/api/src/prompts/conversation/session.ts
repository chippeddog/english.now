import type {
	ConversationSessionContext,
	DailyConversationActivity,
} from "@english.now/db";
import {
	getConversationSessionMeta,
	normalizeConversationActivityPayload,
} from "../../services/conversation-mode";
import {
	buildConversationGreeting,
	buildConversationSystemPrompt,
} from "./system";

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
