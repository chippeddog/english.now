import { createFileRoute, Link } from "@tanstack/react-router";
import { PUBLIC_PAGES, seo } from "@/utils/seo";

export const Route = createFileRoute("/_public/terms")({
	head: () => seo(PUBLIC_PAGES.terms),
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="container relative mx-auto max-w-6xl px-4 py-16 pb-24">
			<article className="typeset typeset-docs mx-auto max-w-[40em]">
				<header className="text-center">
					<h1 className="mb-2 font-bold font-geist-serif text-4xl tracking-tight md:text-5xl">
						Terms of Service
					</h1>
					<p className="text-muted-foreground">
						Last updated: <time dateTime="2026-01-01">January 1, 2026</time>
					</p>
				</header>

				<section>
					<h2>Introduction</h2>
					<p>
						Welcome to <strong>English.now</strong> ("Platform," "we," "us," or
						"our"), an open-source English learning self-study platform and
						application. By accessing or using our Services, you agree to be
						bound by these Terms of Service ("Terms").
					</p>
					<p>
						English.now is designed to help users improve their English language
						skills through interactive lessons, vocabulary training, grammar
						exercises, fluency practice, and AI-powered learning tools.
					</p>
				</section>

				<section>
					<h2>Open Source License</h2>
					<p>
						English.now is an open-source project. The source code is available
						under the terms of the applicable open-source license (see our{" "}
						<a
							href="https://github.com/chippeddog/english.now"
							target="_blank"
							rel="noopener noreferrer"
						>
							GitHub repository
						</a>{" "}
						for specific license details).
					</p>
					<p>
						You are free to use, modify, and distribute the source code in
						accordance with the open-source license. However, these Terms govern
						your use of the hosted Platform and Services provided by us.
					</p>
				</section>

				<section>
					<h2>Acceptance of Terms</h2>
					<p>
						By creating an account, accessing, or using English.now, you
						acknowledge that you have read, understood, and agree to be bound by
						these Terms and our <Link to="/privacy">Privacy Policy</Link>.
					</p>
					<p>
						If you do not agree to these Terms, please do not use our Services.
						We reserve the right to modify these Terms at any time, and your
						continued use of the Platform constitutes acceptance of any changes.
					</p>
				</section>

				<section>
					<h2>Eligibility</h2>
					<p>
						You must be at least 13 years old to use English.now. If you are
						under 18, you must have parental or guardian consent to use our
						Services. By using the Platform, you represent and warrant that you
						meet these eligibility requirements.
					</p>
				</section>

				<section>
					<h2>Account Registration</h2>
					<p>
						To access certain features, you may need to create an account. When
						registering, you agree to:
					</p>
					<ul>
						<li>Provide accurate, current, and complete information</li>
						<li>Maintain and update your information to keep it accurate</li>
						<li>Keep your login credentials secure and confidential</li>
						<li>
							Notify us immediately of any unauthorized access to your account
						</li>
						<li>
							Accept responsibility for all activities that occur under your
							account
						</li>
					</ul>
					<p>
						We reserve the right to suspend or terminate accounts that violate
						these Terms or engage in suspicious activity.
					</p>
				</section>

				<section>
					<h2>Services Provided</h2>
					<p>English.now offers the following learning features:</p>
					<ul>
						<li>
							<strong>Vocabulary Training:</strong> Build and expand your
							English vocabulary through interactive exercises and spaced
							repetition
						</li>
						<li>
							<strong>Grammar Lessons:</strong> Learn English grammar rules with
							clear explanations and practice exercises
						</li>
						<li>
							<strong>Fluency Practice:</strong> Improve speaking and listening
							skills through conversation practice
						</li>
						<li>
							<strong>AI-Powered Chat:</strong> Practice English conversations
							with our AI language assistant
						</li>
						<li>
							<strong>Progress Tracking:</strong> Monitor your learning journey
							with detailed progress reports
						</li>
						<li>
							<strong>Courses:</strong> Structured learning paths tailored to
							different proficiency levels
						</li>
					</ul>
				</section>

				<section>
					<h2>User Conduct</h2>
					<p>When using English.now, you agree NOT to:</p>
					<ul>
						<li>Use the Platform for any illegal or unauthorized purpose</li>
						<li>
							Attempt to gain unauthorized access to our systems or other users'
							accounts
						</li>
						<li>
							Upload or transmit viruses, malware, or other malicious code
						</li>
						<li>Harass, abuse, or harm other users</li>
						<li>
							Use automated systems or bots to access the Platform without
							permission
						</li>
						<li>
							Reproduce, duplicate, or exploit any portion of the Service for
							commercial purposes without express permission
						</li>
						<li>
							Interfere with or disrupt the integrity or performance of the
							Platform
						</li>
						<li>
							Attempt to reverse engineer or decompile any portion of the
							Services (except as permitted by the open-source license)
						</li>
					</ul>
				</section>

				<section>
					<h2>Contact Us</h2>
					<p>
						If you have any questions about these Terms of Service, please
						contact us:
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
