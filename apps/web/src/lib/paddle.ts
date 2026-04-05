import {
	type CheckoutEventsData,
	initializePaddle,
	type Paddle,
} from "@paddle/paddle-js";

let paddleInstance: Paddle | null = null;
let paddlePromise: Promise<Paddle | undefined> | null = null;

export type PaddlePricePreview = {
	priceId: string;
	billingInterval: "day" | "week" | "month" | "year" | null;
	currencyCode: string;
	total: string;
	totalFormatted: string;
};

/**
 * Initialize and return the Paddle.js instance.
 * Reuses the same promise/instance across calls.
 */
export async function getPaddle(): Promise<Paddle | undefined> {
	if (paddleInstance) return paddleInstance;

	if (!paddlePromise) {
		paddlePromise = initializePaddle({
			environment:
				(import.meta.env.VITE_PADDLE_ENVIRONMENT as "sandbox" | "production") ??
				"sandbox",
			token:
				import.meta.env.VITE_PADDLE_ENVIRONMENT === "production"
					? import.meta.env.VITE_PADDLE_CLIENT_TOKEN
					: "test_ff78a1c2ad0b539c77ae84ed3b7",
		});
	}

	const instance = await paddlePromise;
	if (instance) paddleInstance = instance;
	return instance;
}

export async function getPricePreviews(options: {
	priceIds: string[];
	discountId?: string | null;
}): Promise<Record<string, PaddlePricePreview>> {
	if (options.priceIds.length === 0) {
		return {};
	}

	const paddle = await getPaddle();
	if (!paddle) {
		console.error("[Paddle] Failed to initialize Paddle.js");
		return {};
	}

	const response = await paddle.PricePreview({
		items: options.priceIds.map((priceId) => ({
			priceId,
			quantity: 1,
		})),
		...(options.discountId ? { discountId: options.discountId } : {}),
	});

	return Object.fromEntries(
		response.data.details.lineItems.flatMap((lineItem) => {
			if (!lineItem.price?.id) {
				return [];
			}

			return [
				[
					lineItem.price.id,
					{
						priceId: lineItem.price.id,
						billingInterval: lineItem.price.billingCycle?.interval ?? null,
						currencyCode: lineItem.price.unitPrice.currencyCode,
						total: lineItem.totals.total,
						totalFormatted: lineItem.formattedTotals.total,
					},
				] as const,
			];
		}),
	);
}

/**
 * Open a Paddle overlay checkout for a given price.
 *
 * @param priceId - Paddle price ID (e.g., "pri_01abc...")
 * @param userId  - Your app's user ID, passed as customData so webhooks can link the subscription
 * @param email   - Optional customer email to prefill checkout
 * @param onSuccess - Optional callback fired on checkout.completed
 */
export async function openCheckout(options: {
	priceId: string;
	userId: string;
	email?: string;
	onSuccess?: (data: CheckoutEventsData) => void;
}) {
	const paddle = await getPaddle();
	if (!paddle) {
		console.error("[Paddle] Failed to initialize Paddle.js");
		return;
	}

	paddle.Checkout.open({
		items: [{ priceId: options.priceId, quantity: 1 }],
		customData: { userId: options.userId },
		...(options.email ? { customer: { email: options.email } } : {}),
		settings: {
			showAddDiscounts: true,
			displayMode: "overlay",
			theme: "light",
			successUrl: `${window.location.origin}/home?paddle=true`,
		},
	});
}
