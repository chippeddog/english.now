import { getCurrentSubscription } from "@english.now/api/services/subscription";
import { auth } from "@english.now/auth";
import { db, sql, subscription } from "@english.now/db";
import { capabilities, env } from "@english.now/env/server";
import {
	Environment,
	type EventEntity,
	EventName,
	Paddle,
	type SubscriptionNotification,
} from "@paddle/paddle-node-sdk";
import * as Sentry from "@sentry/node";
import { Hono } from "hono";

const paddleRoutes = new Hono();

const paddle =
	capabilities.billing && env.PADDLE_API_KEY
		? new Paddle(env.PADDLE_API_KEY, {
				environment:
					env.PADDLE_ENVIRONMENT === "production"
						? Environment.production
						: Environment.sandbox,
			})
		: null;

paddleRoutes.use("*", async (c, next) => {
	if (!paddle) {
		return c.json({ error: "Billing is not configured" }, 404);
	}
	return next();
});

paddleRoutes.post("/customer-portal", async (c) => {
	if (!paddle) return c.json({ error: "Billing is not configured" }, 404);

	const session = await auth.api.getSession({
		headers: c.req.raw.headers,
	});

	if (!session?.user?.id) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const currentSubscription = await getCurrentSubscription(session.user.id);
	const customerId = currentSubscription?.paddleCustomerId;

	if (!customerId) {
		return c.json({ error: "No Paddle customer found" }, 404);
	}

	try {
		const portalSession = await paddle.customerPortalSessions.create(
			customerId,
			currentSubscription?.paddleSubscriptionId
				? [currentSubscription.paddleSubscriptionId]
				: [],
		);

		return c.json({
			url: portalSession.urls.general.overview,
		});
	} catch (error) {
		console.error(
			"[Paddle Portal] Failed to create customer portal session:",
			error,
		);
		return c.json({ error: "Failed to create customer portal session" }, 500);
	}
});

const SUBSCRIPTION_EVENTS = new Set<string>([
	EventName.SubscriptionCreated,
	EventName.SubscriptionUpdated,
	EventName.SubscriptionActivated,
	EventName.SubscriptionTrialing,
	EventName.SubscriptionCanceled,
	EventName.SubscriptionPaused,
	EventName.SubscriptionResumed,
	EventName.SubscriptionPastDue,
]);

/**
 * Paddle Webhook Handler
 *
 * Receives webhook events from Paddle and updates the local subscription
 * table accordingly. The webhook secret is used to verify the signature
 * of each incoming request.
 */
paddleRoutes.post("/webhook", async (c) => {
	if (!paddle || !env.PADDLE_WEBHOOK_SECRET) {
		return c.json({ error: "Billing is not configured" }, 404);
	}

	const signature = c.req.header("paddle-signature");
	if (!signature) {
		return c.json({ error: "Missing Paddle-Signature header" }, 400);
	}

	const rawBody = await c.req.text();

	let event: EventEntity;
	try {
		event = await paddle.webhooks.unmarshal(
			rawBody,
			env.PADDLE_WEBHOOK_SECRET,
			signature,
		);
	} catch (e) {
		console.error("[Paddle Webhook] Signature verification failed:", e);
		return c.json({ error: "Invalid signature" }, 403);
	}

	try {
		if (SUBSCRIPTION_EVENTS.has(event.eventType)) {
			await upsertSubscription(
				event.data as SubscriptionNotification,
				new Date(event.occurredAt),
			);
		} else {
			console.log(`[Paddle Webhook] Unhandled event type: ${event.eventType}`);
		}
	} catch (e) {
		console.error("[Paddle Webhook] Error processing event:", e);
		return c.json({ error: "Webhook processing failed" }, 500);
	}

	return c.json({ received: true }, 200);
});

/**
 * Upserts a subscription record from a Paddle subscription notification.
 * The userId is extracted from customData that was passed during checkout.
 * Events older than the last applied one are ignored, since Paddle does not
 * guarantee delivery order.
 */
async function upsertSubscription(
	data: SubscriptionNotification,
	occurredAt: Date,
) {
	const userId = (data.customData as Record<string, string> | null)?.userId;
	if (!userId) {
		const message = `[Paddle Webhook] No userId in customData for subscription ${data.id}`;
		console.error(message);
		Sentry.captureMessage(message, {
			level: "error",
			extra: { subscriptionId: data.id, customerId: data.customerId },
		});
		return;
	}

	const priceId = data.items?.[0]?.price?.id ?? null;
	const periodStart = data.currentBillingPeriod?.startsAt
		? new Date(data.currentBillingPeriod.startsAt)
		: null;
	const periodEnd = data.currentBillingPeriod?.endsAt
		? new Date(data.currentBillingPeriod.endsAt)
		: null;
	const canceledAt = data.canceledAt ? new Date(data.canceledAt) : null;
	const now = new Date();

	const result = await db
		.insert(subscription)
		.values({
			id: crypto.randomUUID(),
			userId,
			paddleSubscriptionId: data.id,
			paddleCustomerId: data.customerId,
			paddlePriceId: priceId,
			status: data.status,
			currentPeriodStart: periodStart,
			currentPeriodEnd: periodEnd,
			canceledAt,
			paddleEventOccurredAt: occurredAt,
		})
		.onConflictDoUpdate({
			target: subscription.paddleSubscriptionId,
			set: {
				status: data.status,
				paddlePriceId: priceId,
				currentPeriodStart: periodStart,
				currentPeriodEnd: periodEnd,
				canceledAt,
				paddleEventOccurredAt: occurredAt,
				updatedAt: now,
			},
			setWhere: sql`${subscription.paddleEventOccurredAt} is null or ${subscription.paddleEventOccurredAt} <= ${occurredAt.toISOString()}::timestamp`,
		})
		.returning({ id: subscription.id });

	if (result.length === 0) {
		console.log(
			`[Paddle Webhook] Ignored stale event for subscription ${data.id} (${occurredAt.toISOString()})`,
		);
		return;
	}

	console.log(
		`[Paddle Webhook] Subscription ${data.id} upserted with status: ${data.status}`,
	);
}

export default paddleRoutes;
