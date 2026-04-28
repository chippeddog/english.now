type PracticeAccessSummary = {
	isPro: boolean;
	conversation: {
		hasAccess: boolean;
		latestResourceId: string | null;
	};
	pronunciation: {
		hasAccess: boolean;
		latestResourceId: string | null;
	};
	grammar: {
		hasAccess: boolean;
		latestResourceId: string | null;
	};
};

type AiActivity = {
	id: string;
	type: "conversation" | "pronunciation";
	sessionId?: string | null;
};

export type PracticeGateState = "available" | "resume" | "locked";

export function getPracticeTypeGateState(
	access: PracticeAccessSummary | null | undefined,
	type: "conversation" | "pronunciation",
): PracticeGateState {
	const featureAccess = access?.[type];

	if (!access || access.isPro || featureAccess?.hasAccess) {
		return "available";
	}

	if (featureAccess?.latestResourceId) {
		return "resume";
	}

	return "locked";
}

export function getActivityGateState(
	access: PracticeAccessSummary | null | undefined,
	activity: AiActivity,
): PracticeGateState {
	const featureAccess = access?.[activity.type];

	if (!access || access.isPro || featureAccess?.hasAccess) {
		return "available";
	}

	if (
		activity.sessionId &&
		activity.sessionId === featureAccess?.latestResourceId
	) {
		return "resume";
	}

	return "locked";
}

export function isFreePracticeLimitError(error: unknown) {
	if (!(error instanceof Error)) {
		return false;
	}

	return (
		error.message.includes("FREE_WEEKLY_PRACTICE_LIMIT_REACHED") ||
		error.message.includes("FREE_DAILY_LIMIT_REACHED")
	);
}
