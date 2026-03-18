import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/about")({
	component: About,
});

const DIFFERENTIATORS = [
	{
		title: "Duolingo doesn't teach you to speak",
		description:
			"Gamified apps focus on tapping and matching. You earn points but can't hold a real conversation. English.now puts speaking first with AI conversations that feel like talking to a patient friend.",
	},
	{
		title: "We adapt to you, not the other way around",
		description:
			"Every lesson, every correction, every vocabulary suggestion is personalized to your level, your goals, and the mistakes you actually make. No one-size-fits-all curriculum.",
	},
	{
		title: "Real feedback, not just right or wrong",
		description:
			"When you make a mistake, we explain why it's wrong and how to fix it. Grammar, pronunciation, word choice. You learn the reasoning, not just the answer.",
	},
	{
		title: "Available 24/7, no scheduling required",
		description:
			"No booking a tutor two weeks out. No cancellation fees. Practice at 2 AM or on your lunch break. The AI is always ready when you are.",
	},
];

const USERS = [
	{
		title: "Career-driven professionals",
		description:
			"Engineers, designers, and managers who need confident English for meetings, interviews, and international teams.",
	},
	{
		title: "Students preparing for exams",
		description:
			"Learners studying for IELTS, TOEFL, or university entrance exams who need structured practice and measurable progress.",
	},
	{
		title: "Self-taught learners",
		description:
			"People who watch English content and want to go from passive understanding to active fluency without a tutor.",
	},
	{
		title: "Travelers and expats",
		description:
			"Anyone moving abroad or traveling frequently who needs practical, real-world English for everyday situations.",
	},
];

export default function About() {
	return (
		<div className="container relative mx-auto max-w-3xl px-4 py-10 md:py-20">
			{/* Hero */}
			<div className="mx-auto mb-20 max-w-2xl text-center">
				<p className="mb-3 font-semibold text-lime-600 text-xs uppercase tracking-[0.2em] dark:text-lime-400">
					What is this
				</p>
				<h1 className="mb-5 font-bold font-lyon text-4xl text-neutral-900 tracking-tight md:text-5xl dark:text-white">
					About English.now
				</h1>
				<p className="mx-auto max-w-lg text-balance text-muted-foreground md:text-lg">
					An AI-powered English learning app that helps you speak, think, and
					communicate in English through real practice, not gamified drills.
				</p>
			</div>

			{/* Solution */}
			<section className="mb-20">
				<p className="mb-3 font-semibold text-lime-600 text-xs uppercase tracking-[0.2em] dark:text-lime-400">
					Solution
				</p>
				<h2 className="mb-6 font-bold font-lyon text-3xl text-neutral-900 tracking-tight md:text-4xl dark:text-white">
					What English.now does
				</h2>
				<div className="space-y-4 text-muted-foreground leading-relaxed md:text-base">
					<p>
						English.now combines AI conversations, personalized lessons,
						vocabulary building, pronunciation coaching, and grammar correction
						into one app. Everything adapts to your level.
					</p>
					<p>
						"How do I sound more natural?" "What's the difference between these
						two words?" "Correct my pronunciation on this sentence."
					</p>
					<p>
						Unlike generic chatbots, English.now is built specifically for
						language learners. It understands your native language, tracks your
						progress, and gives you feedback that actually helps you improve. No
						copy-pasting prompts. No switching between apps.
					</p>
				</div>
			</section>

			{/* Differentiators */}
			<section className="mb-20">
				<p className="mb-3 font-semibold text-lime-600 text-xs uppercase tracking-[0.2em] dark:text-lime-400">
					Differentiators
				</p>
				<h2 className="mb-8 font-bold font-lyon text-3xl text-neutral-900 tracking-tight md:text-4xl dark:text-white">
					Why not just use Duolingo?
				</h2>
				<div className="space-y-6">
					{DIFFERENTIATORS.map((item, index) => (
						<div
							key={item.title}
							className="rounded-xl border border-border bg-card p-5 sm:p-6"
						>
							<div className="mb-2 flex items-start gap-3">
								<span className="shrink-0 font-bold font-mono text-lime-600 text-sm dark:text-lime-400">
									#{String(index + 1).padStart(2, "0")}.
								</span>
								<h3 className="font-semibold text-neutral-900 dark:text-white">
									{item.title}
								</h3>
							</div>
							<p className="ml-10 text-muted-foreground text-sm leading-relaxed md:text-base">
								{item.description}
							</p>
						</div>
					))}
				</div>
			</section>

			{/* Origin */}
			<section className="mb-20">
				<p className="mb-3 font-semibold text-lime-600 text-xs uppercase tracking-[0.2em] dark:text-lime-400">
					Origin
				</p>
				<h2 className="mb-6 font-bold font-lyon text-3xl text-neutral-900 tracking-tight md:text-4xl dark:text-white">
					Why we built this
				</h2>
				<div className="space-y-4 text-muted-foreground leading-relaxed md:text-base">
					<p>
						I grew up in Ukraine where learning English felt like an impossible
						mountain to climb. Traditional classes were boring, textbooks were
						outdated, and apps felt more like games than real learning tools.
					</p>
					<p>
						That's when it hit me:{" "}
						<span className="rounded-sm bg-[#D8FF76]/50 px-1 font-medium text-lime-700 dark:text-lime-400">
							the best way to learn a language is by actually using it.
						</span>{" "}
						Not by memorizing vocabulary lists or completing gamified lessons
						that give you points but don't prepare you for real-world
						conversations.
					</p>
					<p>
						English.now is my answer to everything that frustrated me about
						language learning. It's built on a simple belief:{" "}
						<span className="rounded-sm bg-[#D8FF76]/50 px-1 font-medium text-lime-700 dark:text-lime-400">
							AI can be that patient friend.
						</span>{" "}
						It never judges your mistakes, it's available 24/7, and it adapts to
						exactly where you are in your learning journey.
					</p>
					<p>
						It is completely{" "}
						<Link
							className="font-medium text-lime-700 underline dark:text-lime-400"
							to="/login"
						>
							free to start
						</Link>
						, and I'm committed to keeping it that way.
					</p>
				</div>
				<div className="mt-6 flex items-center gap-3">
					<div className="flex flex-col">
						<span className="flex items-center gap-2 font-medium text-neutral-900 text-sm dark:text-white">
							Dmytro Tihunov
							<a
								href="https://x.com/chippeddog"
								target="_blank"
								rel="noopener"
								aria-label="X (Twitter)"
								className="text-muted-foreground transition-colors hover:text-neutral-900 dark:hover:text-white"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="size-4"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<path
										fill="currentColor"
										d="m17.687 3.063l-4.996 5.711l-4.32-5.711H2.112l7.477 9.776l-7.086 8.099h3.034l5.469-6.25l4.78 6.25h6.102l-7.794-10.304l6.625-7.571zm-1.064 16.06L5.654 4.782h1.803l10.846 14.34z"
									/>
								</svg>
							</a>
						</span>
						<span className="text-muted-foreground text-sm">
							Founder, English Now
						</span>
					</div>
				</div>
			</section>

			{/* Users */}
			<section className="mb-20">
				<p className="mb-3 font-semibold text-lime-600 text-xs uppercase tracking-[0.2em] dark:text-lime-400">
					Users
				</p>
				<h2 className="mb-4 font-bold font-lyon text-3xl text-neutral-900 tracking-tight md:text-4xl dark:text-white">
					Who uses English.now
				</h2>
				<p className="mb-8 text-muted-foreground md:text-base">
					Anyone who wants to go from understanding English to actually speaking
					it with confidence.
				</p>
				<div className="grid gap-4 sm:grid-cols-2">
					{USERS.map((user) => (
						<div
							key={user.title}
							className="rounded-xl border border-border bg-card p-5"
						>
							<h3 className="mb-2 font-semibold text-neutral-900 text-sm dark:text-white">
								{user.title}
							</h3>
							<p className="text-muted-foreground text-sm leading-relaxed">
								{user.description}
							</p>
						</div>
					))}
				</div>
			</section>

			{/* Contact */}
			<section>
				<p className="mb-3 font-semibold text-lime-600 text-xs uppercase tracking-[0.2em] dark:text-lime-400">
					Contact
				</p>
				<h2 className="mb-4 font-bold font-lyon text-3xl text-neutral-900 tracking-tight md:text-4xl dark:text-white">
					Questions?
				</h2>
				<p className="mb-6 text-muted-foreground md:text-base">
					We're a small team. You'll probably talk to someone who writes code or
					designs the product.
				</p>
				<div className="space-y-2 text-sm">
					<p>
						<span className="font-medium text-neutral-900 dark:text-white">
							General inquiries:
						</span>{" "}
						<a
							href="mailto:contact@english.now"
							className="text-lime-700 underline dark:text-lime-400"
						>
							contact@english.now
						</a>
					</p>
					<p>
						<span className="font-medium text-neutral-900 dark:text-white">
							Support:
						</span>{" "}
						<a
							href="mailto:support@english.now"
							className="text-lime-700 underline dark:text-lime-400"
						>
							support@english.now
						</a>
					</p>
					<p>
						<span className="font-medium text-neutral-900 dark:text-white">
							Sales:
						</span>{" "}
						<a
							href="mailto:sales@english.now"
							className="text-lime-700 underline dark:text-lime-400"
						>
							sales@english.now
						</a>
					</p>
				</div>
			</section>
		</div>
	);
}
