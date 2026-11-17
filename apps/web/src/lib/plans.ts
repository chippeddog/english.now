const PADDLE_PRICE_IDS = {
	monthly:
		import.meta.env.VITE_PADDLE_ENVIRONMENT === "production"
			? (import.meta.env.VITE_PADDLE_PRICE_MONTHLY ?? "")
			: "pri_01kh1nvx0wzte3e2eh167dmpn1",
	yearly:
		import.meta.env.VITE_PADDLE_ENVIRONMENT === "production"
			? (import.meta.env.VITE_PADDLE_PRICE_YEARLY ?? "")
			: "pri_01kh1nxwx4xjmzas0fgwkvjb1k",
} as const;

const _plans = [
	{
		key: "free" as const,
		name: "Free",
		description: "Great for beginners.",
		price: 0,
		isPopular: false,
		duration: "forever" as const,
		paddlePriceId: null as string | null,
		features: [
			"First unit free + 1 new lesson per day",
			"3 AI practice sessions per week",
			"Conversation, pronunciation, or grammar practice",
			"10 vocab adds + 15 review cards per day",
			"Basic feedback preview",
			"Progress tracking",
		],
	},
	{
		key: "monthly" as const,
		name: "Monthly",
		description: "Great for intermediate learners.",
		price: 9.99,
		isPopular: true,
		duration: "month" as const,
		paddlePriceId: PADDLE_PRICE_IDS.monthly,
		features: [
			"Unlimited AI practice",
			"Full lesson access",
			"Full AI feedback and corrections",
			"Unlimited vocabulary practice and saves",
			"Personalized learning path",
			"Progress tracking and analytics",
		],
	},
	{
		key: "yearly" as const,
		name: "Yearly",
		description: "Great for advanced learners.",
		price: 89.99,
		isPopular: false,
		duration: "year" as const,
		paddlePriceId: PADDLE_PRICE_IDS.yearly,
		features: [
			"Unlimited AI practice",
			"Full lesson access",
			"Full AI feedback and corrections",
			"Unlimited vocabulary practice and saves",
			"Personalized learning path",
			"Progress tracking and analytics",
		],
	},
];

export default _plans;

export type BillingPeriod = "monthly" | "yearly";
export type PricingTierKey = "free" | "pro" | "business";

export type PricingTier = {
	key: PricingTierKey;
	isPopular: boolean;
	/** `null` means custom pricing, quoted by sales. */
	prices: Record<BillingPeriod, number> | null;
	paddlePriceIds: Record<BillingPeriod, string> | null;
	cta: "signup" | "checkout" | "contact";
};

export const pricingTiers: PricingTier[] = [
	{
		key: "free",
		isPopular: false,
		prices: { monthly: 0, yearly: 0 },
		paddlePriceIds: null,
		cta: "signup",
	},
	{
		key: "pro",
		isPopular: true,
		prices: { monthly: 9.99, yearly: 89.99 },
		paddlePriceIds: PADDLE_PRICE_IDS,
		cta: "checkout",
	},
	{
		key: "business",
		isPopular: false,
		prices: null,
		paddlePriceIds: null,
		cta: "contact",
	},
];

export function getMonthlyEquivalent(tier: PricingTier, period: BillingPeriod) {
	if (!tier.prices) return null;
	return period === "yearly" ? tier.prices.yearly / 12 : tier.prices.monthly;
}

export function getYearlySavingsPercent(tier: PricingTier) {
	if (!tier.prices) return 0;
	const fullYear = tier.prices.monthly * 12;
	if (fullYear === 0) return 0;
	return Math.round((1 - tier.prices.yearly / fullYear) * 100);
}
