import { supportedLanguages } from "@english.now/i18n";
import { createFileRoute } from "@tanstack/react-router";
import { allPosts } from "content-collections";
import plans from "@/lib/plans";
import {
	absoluteUrl,
	getProPrices,
	PUBLIC_PAGES,
	SITE_DESCRIPTION,
	SITE_NAME,
	SOCIAL_LINKS,
	SUPPORT_EMAIL,
} from "@/utils/seo";

const languageNames = new Intl.DisplayNames(["en"], { type: "language" });

export const Route = createFileRoute("/llms.txt")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const baseUrl = (
					import.meta.env.VITE_APP_URL || new URL(request.url).origin
				).replace(/\/+$/, "");
				const url = (path: string) => absoluteUrl(path, baseUrl);
				const link = (page: {
					name: string;
					path: string;
					description: string;
				}) => `- [${page.name}](${url(page.path)}): ${page.description}`;

				const pro = getProPrices();
				const freePlan = plans.find((plan) => plan.key === "free");
				const posts = [...allPosts].sort(
					(a, b) =>
						new Date(b.published).getTime() - new Date(a.published).getTime(),
				);
				const languages = supportedLanguages
					.map((code) => languageNames.of(code) ?? code)
					.join(", ");

				const content = `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

${SITE_NAME} helps adult learners improve spoken and written English through short daily lessons, AI conversation practice, and personalized feedback. It runs in the browser at ${url("/")}.

## Key facts

- Lessons and topics follow the CEFR scale, from A1 (beginner) to C2 (proficient).
- AI conversation practice: learners talk with an AI tutor by text or voice and get corrections in real time.
- Pronunciation coaching with feedback on individual sounds and words.
- Vocabulary practice with spaced repetition (SM-2) for long-term retention.
- A personalized learning path adapts to each learner's level and goals.
- Progress is saved to the learner's account and synced across devices.
- The interface is available in ${supportedLanguages.length} languages: ${languages}.

## Pricing

- Free: $0, no credit card required. Includes: ${(freePlan?.features ?? []).join("; ")}.
- Pro: $${pro.monthly.toFixed(2)}/month or $${pro.yearly.toFixed(2)}/year. Unlimited AI practice, full lesson access, full AI feedback and corrections, unlimited vocabulary, and a personalized learning path.
- Business: custom pricing for teams, with manager reporting and a pilot-first rollout.

## Pages

${[
	PUBLIC_PAGES.home,
	PUBLIC_PAGES.features,
	PUBLIC_PAGES.pricing,
	PUBLIC_PAGES.forBusiness,
	PUBLIC_PAGES.bookADemo,
	PUBLIC_PAGES.about,
	PUBLIC_PAGES.contact,
]
	.map(link)
	.join("\n")}

## Learning resources

${link(PUBLIC_PAGES.blog)}
${posts
	.map(
		(post) =>
			`- [${post.title}](${url(`/blog/${post.slug}`)}): ${post.summary}`,
	)
	.join("\n")}
${link(PUBLIC_PAGES.tools)}

## Contact

- Email: ${SUPPORT_EMAIL}
${SOCIAL_LINKS.map((href) => `- ${href}`).join("\n")}

## Optional

${[PUBLIC_PAGES.privacy, PUBLIC_PAGES.terms, PUBLIC_PAGES.refund]
	.map(link)
	.join("\n")}
`;

				return new Response(content, {
					headers: {
						"Content-Type": "text/plain; charset=utf-8",
						"Cache-Control": "public, max-age=3600",
					},
				});
			},
		},
	},
});
