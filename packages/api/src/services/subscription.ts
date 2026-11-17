import { db, desc, eq, sql, subscription } from "@english.now/db";
import { capabilities } from "@english.now/env/server";

export type SubscriptionRecord = typeof subscription.$inferSelect;

export type SubscriptionSummary = {
	status: string | null;
	isPro: boolean;
	plan: "free" | "pro";
	currentPeriodEnd: Date | null;
	canceledAt: Date | null;
};

export function getSubscriptionSummary(
	sub: SubscriptionRecord | null,
	billingEnabled: boolean = capabilities.billing,
): SubscriptionSummary {
	const status = sub?.status ?? null;
	// Self-hosted instances without billing give every learner full access.
	const isPro = !billingEnabled || status === "active" || status === "trialing";

	return {
		status,
		isPro,
		plan: isPro ? "pro" : "free",
		currentPeriodEnd: sub?.currentPeriodEnd ?? null,
		canceledAt: sub?.canceledAt ?? null,
	};
}

export async function getCurrentSubscription(userId: string) {
	const [sub] = await db
		.select()
		.from(subscription)
		.where(eq(subscription.userId, userId))
		.orderBy(
			sql`CASE
				WHEN ${subscription.status} = 'active' THEN 0
				WHEN ${subscription.status} = 'trialing' THEN 1
				WHEN ${subscription.status} = 'paused' THEN 2
				WHEN ${subscription.status} = 'past_due' THEN 3
				WHEN ${subscription.status} = 'canceled' THEN 4
				ELSE 5
			END`,
			desc(subscription.createdAt),
		)
		.limit(1);

	return sub ?? null;
}

export async function getSubscriptionSummaryForUser(userId: string) {
	const currentSubscription = await getCurrentSubscription(userId);
	return getSubscriptionSummary(currentSubscription);
}
