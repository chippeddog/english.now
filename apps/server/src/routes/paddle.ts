import crypto from "node:crypto";
import { auth } from "@english.now/auth";
import { db, desc, eq, sql, subscription } from "@english.now/db";
import { env } from "@english.now/env/server";
import {
	Environment,
	type EventEntity,
	EventName,
	Paddle,
	type SubscriptionNotification,
} from "@paddle/paddle-node-sdk";
import { Hono } from "hono";

const paddle = new Paddle(env.PADDLE_API_KEY, {
	environment:
		env.PADDLE_ENVIRONMENT === "production"
			? Environment.production
			: Environment.sandbox,
});

const paddleRoutes = new Hono();

async function getCurrentSubscription(userId: string) {
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

paddleRoutes.post("/customer-portal", async (c) => {
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

/**
 * Paddle Webhook Handler
 *
 * Receives webhook events from Paddle and updates the local subscription
 * table accordingly. The webhook secret is used to verify the signature
 * of each incoming request.
 */
paddleRoutes.post("/webhook", async (c) => {
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
		switch (event.eventType) {
			case EventName.SubscriptionCreated:
			case EventName.SubscriptionUpdated:
			case EventName.SubscriptionActivated:
			case EventName.SubscriptionTrialing: {
				const data = event.data as SubscriptionNotification;
				await upsertSubscription(data);
				break;
			}

			case EventName.SubscriptionCanceled: {
				const data = event.data as SubscriptionNotification;
				await upsertSubscription(data);
				break;
			}

			case EventName.SubscriptionPaused: {
				const data = event.data as SubscriptionNotification;
				await upsertSubscription(data);
				break;
			}

			case EventName.SubscriptionResumed: {
				const data = event.data as SubscriptionNotification;
				await upsertSubscription(data);
				break;
			}

			case EventName.SubscriptionPastDue: {
				const data = event.data as SubscriptionNotification;
				await upsertSubscription(data);
				break;
			}

			default:
				console.log(
					`[Paddle Webhook] Unhandled event type: ${event.eventType}`,
				);
		}
	} catch (e) {
		console.error("[Paddle Webhook] Error processing event:", e);
		return c.json({ error: "Webhook processing failed" }, 500);
	}

	return c.json({ received: true }, 200);
});

/**
 * Upserts a subscription record in the database from a Paddle subscription notification.
 * The userId is extracted from customData that was passed during checkout.
 */
async function upsertSubscription(data: SubscriptionNotification) {
	const userId = (data.customData as Record<string, string> | null)?.userId;
	if (!userId) {
		console.error(
			"[Paddle Webhook] No userId in customData for subscription:",
			data.id,
		);
		return;
	}

	const priceId = data.items?.[0]?.price?.id ?? null;
	const periodStart = data.currentBillingPeriod?.startsAt
		? new Date(data.currentBillingPeriod.startsAt)
		: null;
	const periodEnd = data.currentBillingPeriod?.endsAt
		? new Date(data.currentBillingPeriod.endsAt)
		: null;

	// Check if this subscription already exists
	const [existing] = await db
		.select()
		.from(subscription)
		.where(eq(subscription.paddleSubscriptionId, data.id))
		.limit(1);

	if (existing) {
		await db
			.update(subscription)
			.set({
				status: data.status,
				paddlePriceId: priceId,
				currentPeriodStart: periodStart,
				currentPeriodEnd: periodEnd,
				canceledAt: data.canceledAt ? new Date(data.canceledAt) : null,
				updatedAt: new Date(),
			})
			.where(eq(subscription.paddleSubscriptionId, data.id));
	} else {
		await db.insert(subscription).values({
			id: crypto.randomUUID(),
			userId,
			paddleSubscriptionId: data.id,
			paddleCustomerId: data.customerId,
			paddlePriceId: priceId,
			status: data.status,
			currentPeriodStart: periodStart,
			currentPeriodEnd: periodEnd,
			canceledAt: data.canceledAt ? new Date(data.canceledAt) : null,
		});
	}

	console.log(
		`[Paddle Webhook] Subscription ${data.id} upserted with status: ${data.status}`,
	);
}

export default paddleRoutes;
