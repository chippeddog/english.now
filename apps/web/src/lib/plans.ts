const PADDLE_PRICE_IDS = {
	monthly: import.meta.env.VITE_PADDLE_PRICE_MONTHLY ?? "",
	yearly: import.meta.env.VITE_PADDLE_PRICE_YEARLY ?? "",
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
			"1 AI conversation per day (up to 8 replies)",
			"1 pronunciation session per day (3 attempts)",
			"10 vocab adds + 15 review cards per day",
			"Basic feedback preview",
			"Progress tracking",
		],
	},
	{
		key: "monthly" as const,
		name: "Monthly",
		description: "Great for intermediate learners.",
		price: 12,
		isPopular: true,
		duration: "month" as const,
		paddlePriceId: PADDLE_PRICE_IDS.monthly,
		features: [
			"Unlimited AI conversations and pronunciation",
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
		price: 100,
		isPopular: false,
		duration: "year" as const,
		paddlePriceId: PADDLE_PRICE_IDS.yearly,
		features: [
			"Unlimited AI conversations and pronunciation",
			"Full lesson access",
			"Full AI feedback and corrections",
			"Unlimited vocabulary practice and saves",
			"Personalized learning path",
			"Progress tracking and analytics",
		],
	},
];

export default _plans;
