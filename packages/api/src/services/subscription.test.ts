import { describe, expect, it } from "vitest";
import {
	getSubscriptionSummary,
	type SubscriptionRecord,
} from "./subscription";

function sub(status: string): SubscriptionRecord {
	return {
		id: "sub",
		userId: "user",
		paddleSubscriptionId: "paddle-sub",
		paddleCustomerId: null,
		paddlePriceId: null,
		status,
		currentPeriodStart: null,
		currentPeriodEnd: null,
		canceledAt: null,
		paddleEventOccurredAt: null,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
}

describe("getSubscriptionSummary", () => {
	it("is Pro only for active or trialing subscriptions when billing is on", () => {
		expect(getSubscriptionSummary(sub("active"), true).isPro).toBe(true);
		expect(getSubscriptionSummary(sub("trialing"), true).isPro).toBe(true);
		expect(getSubscriptionSummary(sub("past_due"), true).isPro).toBe(false);
		expect(getSubscriptionSummary(sub("canceled"), true).isPro).toBe(false);
		expect(getSubscriptionSummary(null, true)).toMatchObject({
			isPro: false,
			plan: "free",
		});
	});

	it("gives everyone full access on self-hosted instances without billing", () => {
		expect(getSubscriptionSummary(null, false)).toMatchObject({
			isPro: true,
			plan: "pro",
		});
	});
});
