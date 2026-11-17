import { pricingTiers } from "@/lib/plans";
import { createTitle, DEFAULT_TITLE, PAGE_TITLE } from "@/utils/title";

/**
 * SEO / GEO utils
 */
export const SITE_NAME = "English Now";

export const SITE_URL = (
	import.meta.env.VITE_APP_URL || "https://english.now"
).replace(/\/+$/, "");

export const SITE_DESCRIPTION =
	"English Now is an AI-powered English learning app with personalized lessons, real conversations with an AI tutor, pronunciation coaching, and instant feedback.";

export const SUPPORT_EMAIL = "support@english.now";

export const SOCIAL_LINKS = [
	"https://x.com/chippeddog",
	"https://github.com/chippeddog/english.now",
];

const DEFAULT_OG_IMAGE = "/og-image.png";
const DEFAULT_OG_IMAGE_ALT = "English Now — Learn English with AI";

export function absoluteUrl(path: string, baseUrl: string = SITE_URL) {
	if (/^https?:\/\//.test(path)) return path;
	return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

type PublicPage = {
	path: string;
	name: string;
	title: string;
	description: string;
	changefreq: "weekly" | "monthly" | "yearly";
	priority: string;
};

/**
 * Indexable public pages. Shared by route heads, sitemap.xml and llms.txt.
 */
export const PUBLIC_PAGES = {
	home: {
		path: "/",
		name: PAGE_TITLE.home,
		title: DEFAULT_TITLE,
		description: SITE_DESCRIPTION,
		changefreq: "weekly",
		priority: "1.0",
	},
	features: {
		path: "/features",
		name: PAGE_TITLE.features,
		title: createTitle(PAGE_TITLE.features),
		description:
			"Explore English Now features: AI conversation practice, instant feedback, pronunciation coaching, spaced-repetition vocabulary, personalized lessons, and progress tracking.",
		changefreq: "monthly",
		priority: "0.8",
	},
	pricing: {
		path: "/pricing",
		name: PAGE_TITLE.pricing,
		title: createTitle(PAGE_TITLE.pricing),
		description:
			"Compare English Now plans. Start free with daily lessons and AI practice, or upgrade to Pro for unlimited practice, full lesson access, and detailed AI feedback.",
		changefreq: "monthly",
		priority: "0.8",
	},
	forBusiness: {
		path: "/for-business",
		name: PAGE_TITLE.forBusiness,
		title: createTitle(PAGE_TITLE.forBusiness),
		description:
			"AI speaking practice for teams: role-specific scenarios, progress reporting for managers, and a pilot-first rollout. Request a demo.",
		changefreq: "monthly",
		priority: "0.7",
	},
	bookADemo: {
		path: "/book-a-demo",
		name: PAGE_TITLE.bookADemo,
		title: createTitle(PAGE_TITLE.bookADemo),
		description:
			"Book a 30-minute intro call to see English Now for your team and plan a pilot around the conversations employees have at work.",
		changefreq: "monthly",
		priority: "0.6",
	},
	about: {
		path: "/about",
		name: PAGE_TITLE.about,
		title: createTitle(PAGE_TITLE.about),
		description:
			"English Now is an AI-powered English learning app that helps you speak, think, and communicate in English through real practice, not gamified drills.",
		changefreq: "monthly",
		priority: "0.7",
	},
	blog: {
		path: "/blog",
		name: PAGE_TITLE.blog,
		title: createTitle(PAGE_TITLE.blog),
		description:
			"Articles, English learning tips, and product updates from the English Now team.",
		changefreq: "weekly",
		priority: "0.7",
	},
	tools: {
		path: "/tools",
		name: PAGE_TITLE.tools,
		title: createTitle(PAGE_TITLE.tools),
		description:
			"Simple, free tools from English Now to help you practice and improve your English every day.",
		changefreq: "monthly",
		priority: "0.6",
	},
	contact: {
		path: "/contact",
		name: PAGE_TITLE.contact,
		title: createTitle(PAGE_TITLE.contact),
		description:
			"Get in touch with the English Now team for support, feedback, or partnership questions.",
		changefreq: "yearly",
		priority: "0.5",
	},
	privacy: {
		path: "/privacy",
		name: PAGE_TITLE.privacy,
		title: createTitle(PAGE_TITLE.privacy),
		description:
			"How English Now collects, uses, and protects your personal data.",
		changefreq: "yearly",
		priority: "0.3",
	},
	terms: {
		path: "/terms",
		name: PAGE_TITLE.terms,
		title: createTitle(PAGE_TITLE.terms),
		description: "The terms and conditions for using English Now.",
		changefreq: "yearly",
		priority: "0.3",
	},
	refund: {
		path: "/refund",
		name: PAGE_TITLE.refund,
		title: createTitle(PAGE_TITLE.refund),
		description:
			"English Now refund and cancellation policy for subscriptions.",
		changefreq: "yearly",
		priority: "0.3",
	},
} satisfies Record<string, PublicPage>;

type MetaTag =
	| { title: string }
	| { name: string; content: string }
	| { property: string; content: string };

type SeoOptions = {
	title: string;
	description: string;
	path: string;
	image?: string;
	imageAlt?: string;
	type?: "website" | "article";
	publishedTime?: string;
	modifiedTime?: string;
	noindex?: boolean;
};

/**
 * Title, description, canonical URL, Open Graph and Twitter tags for a route `head`.
 */
export function seo({
	title,
	description,
	path,
	image = DEFAULT_OG_IMAGE,
	imageAlt = DEFAULT_OG_IMAGE_ALT,
	type = "website",
	publishedTime,
	modifiedTime,
	noindex,
}: SeoOptions) {
	const url = absoluteUrl(path);
	const imageUrl = absoluteUrl(image);

	const meta: MetaTag[] = [
		{ title },
		{ name: "description", content: description },
		{ property: "og:title", content: title },
		{ property: "og:description", content: description },
		{ property: "og:url", content: url },
		{ property: "og:type", content: type },
		{ property: "og:image", content: imageUrl },
		{ property: "og:image:alt", content: imageAlt },
		{ name: "twitter:title", content: title },
		{ name: "twitter:description", content: description },
		{ name: "twitter:image", content: imageUrl },
	];

	if (publishedTime) {
		meta.push({ property: "article:published_time", content: publishedTime });
	}
	if (modifiedTime) {
		meta.push({ property: "article:modified_time", content: modifiedTime });
	}
	if (noindex) {
		meta.push({ name: "robots", content: "noindex, nofollow" });
	}

	return {
		meta,
		links: [{ rel: "canonical", href: url }],
	};
}

/**
 * JSON-LD script entry for a route `head`.
 */
export function jsonLd(data: Record<string, unknown>) {
	return {
		type: "application/ld+json",
		// Escape "<" so content can never close the <script> tag early.
		children: JSON.stringify({
			"@context": "https://schema.org",
			...data,
		}).replace(/</g, "\\u003c"),
	};
}

const ORGANIZATION_ID = `${SITE_URL}/#organization`;

export const organizationSchema = {
	"@type": "Organization",
	"@id": ORGANIZATION_ID,
	name: SITE_NAME,
	url: absoluteUrl("/"),
	logo: absoluteUrl("/web-app-manifest-512x512.png"),
	email: SUPPORT_EMAIL,
	sameAs: SOCIAL_LINKS,
};

export const websiteSchema = {
	"@type": "WebSite",
	"@id": `${SITE_URL}/#website`,
	name: SITE_NAME,
	url: absoluteUrl("/"),
	description: SITE_DESCRIPTION,
	inLanguage: "en",
	publisher: { "@id": ORGANIZATION_ID },
};

export function getProPrices() {
	const prices = pricingTiers.find((tier) => tier.key === "pro")?.prices;
	return prices ?? { monthly: 0, yearly: 0 };
}

export function softwareApplicationSchema() {
	const pro = getProPrices();

	return {
		"@type": "WebApplication",
		name: SITE_NAME,
		url: absoluteUrl("/"),
		description: SITE_DESCRIPTION,
		applicationCategory: "EducationalApplication",
		operatingSystem: "Web",
		publisher: organizationSchema,
		offers: [
			{
				"@type": "Offer",
				name: "Free",
				price: "0",
				priceCurrency: "USD",
			},
			{
				"@type": "Offer",
				name: "Pro (monthly)",
				price: pro.monthly.toFixed(2),
				priceCurrency: "USD",
			},
			{
				"@type": "Offer",
				name: "Pro (yearly)",
				price: pro.yearly.toFixed(2),
				priceCurrency: "USD",
			},
		],
	};
}

export function faqSchema(items: { question: string; answer: string }[]) {
	return {
		"@type": "FAQPage",
		mainEntity: items.map((item) => ({
			"@type": "Question",
			name: item.question,
			acceptedAnswer: {
				"@type": "Answer",
				text: item.answer,
			},
		})),
	};
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
	return {
		"@type": "BreadcrumbList",
		itemListElement: items.map((item, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: item.name,
			item: absoluteUrl(item.path),
		})),
	};
}
