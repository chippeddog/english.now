import { createFileRoute } from "@tanstack/react-router";
import { PUBLIC_PAGES, seo } from "@/utils/seo";

export const Route = createFileRoute("/_public/privacy")({
	head: () => seo(PUBLIC_PAGES.privacy),
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="container relative mx-auto max-w-4xl px-4 py-16 pb-24">
			<article className="typeset typeset-docs mx-auto max-w-[40em]">
				<header className="text-center">
					<h1 className="mb-2 font-bold font-geist-serif text-4xl tracking-tight md:text-5xl">
						Privacy Policy
					</h1>
					<p className="text-muted-foreground">
						Last updated: <time dateTime="2026-01-01">January 1, 2026</time>
					</p>
				</header>

				<section>
					<h2>Introduction</h2>
					<p>
						english.now is an open-source, self-study English learning platform.
						We are committed to protecting your privacy and being transparent
						about how we handle your data. This Privacy Policy explains what
						information we collect, how we use it, and your rights regarding
						your personal data.
					</p>
					<p>
						As an open-source project, our code is publicly available for
						review, which means you can verify exactly how we handle your data.
					</p>
				</section>

				<section>
					<h2>Information We Collect</h2>

					<h3>Account Information</h3>
					<p>When you create an account, we may collect:</p>
					<ul>
						<li>Email address</li>
						<li>Display name (optional)</li>
						<li>Profile picture (optional)</li>
						<li>Preferred learning settings</li>
					</ul>

					<h3>Learning Progress Data</h3>
					<p>To provide personalized learning experiences, we collect:</p>
					<ul>
						<li>Vocabulary words you've studied and their review status</li>
						<li>Course progress and completion status</li>
						<li>Quiz and exercise results</li>
						<li>Study streaks and learning statistics</li>
					</ul>

					<h3>Technical Data</h3>
					<p>We automatically collect certain technical information:</p>
					<ul>
						<li>Browser type and version</li>
						<li>Device type and operating system</li>
						<li>General location (country/region level)</li>
						<li>Usage patterns and feature interactions</li>
					</ul>
				</section>

				<section>
					<h2>How We Use Your Information</h2>
					<p>We use your information to:</p>
					<ul>
						<li>Provide and maintain the learning platform</li>
						<li>Track and display your learning progress</li>
						<li>Personalize your study experience using spaced repetition</li>
						<li>Send important service updates (with your consent)</li>
						<li>Improve the platform based on usage patterns</li>
						<li>Ensure platform security and prevent abuse</li>
					</ul>
				</section>

				<section>
					<h2>Data Storage & Security</h2>
					<p>
						Your data is stored securely using industry-standard encryption. We
						implement appropriate technical and organizational measures to
						protect your personal information against unauthorized access,
						alteration, disclosure, or destruction.
					</p>
					<p>
						As an open-source project, we believe in transparency. You can
						review our security practices in our{" "}
						<a
							href="https://github.com/chippeddog/english.now"
							target="_blank"
							rel="noopener noreferrer"
						>
							public repository
						</a>
						.
					</p>
				</section>

				<section>
					<h2>Your Rights</h2>
					<p>You have the right to:</p>
					<ul>
						<li>Access your personal data</li>
						<li>Correct inaccurate data</li>
						<li>Delete your account and associated data</li>
						<li>Export your learning progress data</li>
						<li>Opt out of non-essential communications</li>
					</ul>
					<p>
						To exercise any of these rights, you can use the settings in your
						account or contact us directly.
					</p>
				</section>

				<section>
					<h2>Contact Us</h2>
					<p>
						If you have any questions about this Privacy Policy, please contact
						us:
					</p>
					<ul>
						<li>
							<strong>GitHub:</strong>{" "}
							<a
								href="https://github.com/chippeddog/english.now"
								target="_blank"
								rel="noopener noreferrer"
							>
								github.com/chippeddog/english.now
							</a>
						</li>
						<li>
							<strong>Email:</strong>{" "}
							<a href="mailto:support@english.now">support@english.now</a>
						</li>
					</ul>
				</section>
			</article>
		</div>
	);
}
