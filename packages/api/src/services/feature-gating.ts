import {
	FREE_CONVERSATION_MAX_AI_REPLIES,
	FREE_DAILY_CONVERSATIONS,
	FREE_DAILY_NEW_LESSON_STARTS,
	FREE_DAILY_PRONUNCIATION_SESSIONS,
	FREE_DAILY_VOCAB_ADDS_LIMIT,
	FREE_DAILY_VOCAB_REVIEW_LIMIT,
	FREE_PRONUNCIATION_MAX_ATTEMPTS,
	PRO_PRONUNCIATION_MAX_ATTEMPTS,
} from "@english.now/shared/feature-limit-config";
import {
	getDailyFeatureUsageTotal,
	getLatestDailyFeatureUsage,
} from "./feature-usage";
import { getSubscriptionSummaryForUser } from "./subscription";

type AccessReason = "pro" | "free_available" | "free_daily_limit_reached";

export type DailyLimitAccessSummary = {
	isPro: boolean;
	limit: number | null;
	used: number;
	remaining: number | null;
	hasAccess: boolean;
	reason: AccessReason;
	latestResourceId: string | null;
};

export type ReportAccessSummary = {
	locked: boolean;
	preview: boolean;
	upgradeReason: "pro_required_for_full_report" | null;
};

export type PracticeAccessSummary = {
	isPro: boolean;
	conversation: DailyLimitAccessSummary;
	pronunciation: DailyLimitAccessSummary;
};

export type LessonAccessSummary = {
	isPro: boolean;
	newLessonStarts: DailyLimitAccessSummary;
};

export type VocabularyAccessSummary = {
	isPro: boolean;
	adds: DailyLimitAccessSummary;
	reviews: DailyLimitAccessSummary;
};

export type SessionCapAccessSummary = {
	isPro: boolean;
	used: number;
	limit: number | null;
	remaining: number | null;
	reachedLimit: boolean;
};

function buildDailyAccessSummary(input: {
	isPro: boolean;
	used: number;
	limit: number;
	latestResourceId?: string | null;
}): DailyLimitAccessSummary {
	if (input.isPro) {
		return {
			isPro: true,
			limit: null,
			used: input.used,
			remaining: null,
			hasAccess: true,
			reason: "pro",
			latestResourceId: input.latestResourceId ?? null,
		};
	}

	const remaining = Math.max(0, input.limit - input.used);

	return {
		isPro: false,
		limit: input.limit,
		used: input.used,
		remaining,
		hasAccess: remaining > 0,
		reason: remaining > 0 ? "free_available" : "free_daily_limit_reached",
		latestResourceId: input.latestResourceId ?? null,
	};
}

export async function getPracticeAccessSummary(
	userId: string,
): Promise<PracticeAccessSummary> {
	const subscription = await getSubscriptionSummaryForUser(userId);
	const [
		conversationUsed,
		pronunciationUsed,
		latestConversation,
		latestPronunciation,
	] = await Promise.all([
		getDailyFeatureUsageTotal(userId, "conversation_session"),
		getDailyFeatureUsageTotal(userId, "pronunciation_session"),
		getLatestDailyFeatureUsage(userId, "conversation_session"),
		getLatestDailyFeatureUsage(userId, "pronunciation_session"),
	]);

	return {
		isPro: subscription.isPro,
		conversation: buildDailyAccessSummary({
			isPro: subscription.isPro,
			used: conversationUsed,
			limit: FREE_DAILY_CONVERSATIONS,
			latestResourceId: latestConversation?.resourceId || null,
		}),
		pronunciation: buildDailyAccessSummary({
			isPro: subscription.isPro,
			used: pronunciationUsed,
			limit: FREE_DAILY_PRONUNCIATION_SESSIONS,
			latestResourceId: latestPronunciation?.resourceId || null,
		}),
	};
}

export async function getConversationAccessSummary(userId: string) {
	return (await getPracticeAccessSummary(userId)).conversation;
}

export async function getPronunciationAccessSummary(userId: string) {
	return (await getPracticeAccessSummary(userId)).pronunciation;
}

export async function getLessonAccessSummary(
	userId: string,
): Promise<LessonAccessSummary> {
	const subscription = await getSubscriptionSummaryForUser(userId);
	const used = await getDailyFeatureUsageTotal(userId, "lesson_start");

	return {
		isPro: subscription.isPro,
		newLessonStarts: buildDailyAccessSummary({
			isPro: subscription.isPro,
			used,
			limit: FREE_DAILY_NEW_LESSON_STARTS,
		}),
	};
}

export async function getVocabularyAccessSummary(
	userId: string,
): Promise<VocabularyAccessSummary> {
	const subscription = await getSubscriptionSummaryForUser(userId);
	const [addsUsed, reviewsUsed] = await Promise.all([
		getDailyFeatureUsageTotal(userId, "vocabulary_add"),
		getDailyFeatureUsageTotal(userId, "vocabulary_review"),
	]);

	return {
		isPro: subscription.isPro,
		adds: buildDailyAccessSummary({
			isPro: subscription.isPro,
			used: addsUsed,
			limit: FREE_DAILY_VOCAB_ADDS_LIMIT,
		}),
		reviews: buildDailyAccessSummary({
			isPro: subscription.isPro,
			used: reviewsUsed,
			limit: FREE_DAILY_VOCAB_REVIEW_LIMIT,
		}),
	};
}

function buildSessionCapAccessSummary(input: {
	isPro: boolean;
	used: number;
	freeLimit: number;
	proLimit?: number | null;
}): SessionCapAccessSummary {
	const limit = input.isPro ? (input.proLimit ?? null) : input.freeLimit;

	if (limit == null) {
		return {
			isPro: input.isPro,
			used: input.used,
			limit: null,
			remaining: null,
			reachedLimit: false,
		};
	}

	const remaining = Math.max(0, limit - input.used);

	return {
		isPro: input.isPro,
		used: input.used,
		limit,
		remaining,
		reachedLimit: remaining <= 0,
	};
}

export async function getConversationReplyAccessSummary(
	userId: string,
	assistantReplies: number,
) {
	const subscription = await getSubscriptionSummaryForUser(userId);

	return buildSessionCapAccessSummary({
		isPro: subscription.isPro,
		used: assistantReplies,
		freeLimit: FREE_CONVERSATION_MAX_AI_REPLIES,
	});
}

export async function getPronunciationAttemptAccessSummary(
	userId: string,
	attemptsUsed: number,
) {
	const subscription = await getSubscriptionSummaryForUser(userId);

	return buildSessionCapAccessSummary({
		isPro: subscription.isPro,
		used: attemptsUsed,
		freeLimit: FREE_PRONUNCIATION_MAX_ATTEMPTS,
		proLimit: PRO_PRONUNCIATION_MAX_ATTEMPTS,
	});
}

export async function getReportAccessSummary(
	userId: string,
): Promise<ReportAccessSummary> {
	const subscription = await getSubscriptionSummaryForUser(userId);

	if (subscription.isPro) {
		return {
			locked: false,
			preview: false,
			upgradeReason: null,
		};
	}

	return {
		locked: true,
		preview: true,
		upgradeReason: "pro_required_for_full_report",
	};
}
