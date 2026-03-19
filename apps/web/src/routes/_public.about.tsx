import { createFileRoute, Link } from "@tanstack/react-router";
import { Bot, type LucideIcon, Sparkles, UserRound } from "lucide-react";

export const Route = createFileRoute("/_public/about")({
	component: About,
});

type ComparisonKey = "tutors" | "gpt" | "englishNow";

type ComparisonColumn = {
	key: ComparisonKey;
	title: string;
	icon: LucideIcon;
	featured?: boolean;
};

type ComparisonRow = {
	label: string;
	values: Record<ComparisonKey, string>;
};

const COMPARISON_COLUMNS: readonly ComparisonColumn[] = [
	{
		key: "tutors",
		title: "Tutors",
		icon: UserRound,
	},
	{
		key: "gpt",
		title: "Just GPT",
		icon: Bot,
	},
	{
		key: "englishNow",
		title: "English.now",
		icon: Sparkles,
		featured: true,
	},
];

const COMPARISON_ROWS: readonly ComparisonRow[] = [
	{
		label: "Approach",
		values: {
			tutors: "Human-led, scheduled sessions.",
			gpt: "Single AI chat that follows your prompts.",
			englishNow: "Guided AI speaking system built for learners.",
		},
	},
	{
		label: "Speed",
		values: {
			tutors: "Progress depends on how often you can book sessions.",
			gpt: "Fast to start, but you build the system yourself.",
			englishNow: "Practice in minutes with a ready-to-use flow.",
		},
	},
	{
		label: "Scale",
		values: {
			tutors: "Limited by calendar time, budget, and tutor availability.",
			gpt: "Works for many tasks, but degrades without structure.",
			englishNow: "Scales to daily speaking practice without extra planning.",
		},
	},
	{
		label: "Quality",
		values: {
			tutors: "Can be great, but quality varies tutor to tutor.",
			gpt: "Smart, but often inconsistent, generic, or too verbose.",
			englishNow: "Consistent feedback tuned for speaking and correction.",
		},
	},
	{
		label: "Output",
		values: {
			tutors: "Conversation, notes, and homework from each session.",
			gpt: "Raw answers and chat threads with detail loss over time.",
			englishNow: "A complete loop of practice, feedback, and repetition.",
		},
	},
];

export default function About() {
	return (
		<div className="container relative z-10 mx-auto max-w-4xl px-4 py-2 pt-10 md:pt-18">
			<div className="mx-auto mb-16 flex max-w-2xl flex-col items-center gap-4 text-center">
				<h1 className="font-bold font-lyon text-4xl text-neutral-900 tracking-tight md:text-5xl dark:text-white">
					About English.now
				</h1>
				<p className="mx-auto max-w-2xl text-balance text-muted-foreground md:text-lg">
					An AI-powered English learning app that helps you speak, think, and
					communicate in English through real practice, not gamified drills.
				</p>
			</div>

			<div
				className="mb-10 overflow-hidden rounded-3xl"
				style={{
					boxShadow:
						"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
				}}
			>
				<img
					src="/images/about.png"
					alt="English.now"
					className="h-auto w-full"
				/>
			</div>
			<hr className="my-16 border-border/50 border-t md:my-24" />
			{/* Origin */}
			<section className="mx-auto mb-20 max-w-3xl">
				<h2 className="mb-6 font-bold font-lyon text-3xl text-neutral-900 tracking-tight md:text-4xl dark:text-white">
					Why I built this
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
								<span className="sr-only">Open X profile</span>
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

			{/* <section className="mx-auto mb-20 max-w-3xl">
				<div className="mb-8">
					<h2 className="mb-4 font-bold font-lyon text-3xl text-neutral-900 tracking-tight md:text-4xl dark:text-white">
						How English.now compares
					</h2>
					<p className="text-muted-foreground leading-relaxed md:text-base">
						Tutors and GPT are useful, but each leaves important gaps.
						English.now combines structure, consistency, and real speaking
						practice in one focused product.
					</p>
				</div>

				<div className="space-y-4 md:hidden">
					{COMPARISON_COLUMNS.map((column) => (
						<div
							key={column.key}
							className={`rounded-2xl border p-5 ${
								column.featured
									? "border-border bg-muted/40 dark:bg-white/4"
									: "border-border bg-card"
							}`}
						>
							<div className="mb-5 flex items-center gap-2">
								<column.icon className="size-4 text-muted-foreground" />
								<h3 className="font-medium text-base text-neutral-900 dark:text-white">
									{column.title}
								</h3>
							</div>

							<div className="space-y-3">
								{COMPARISON_ROWS.map((row) => (
									<div
										key={`${column.key}-${row.label}`}
										className="rounded-xl border border-border/70 bg-background/80 p-3"
									>
										<p className="mb-1 font-medium text-[11px] text-muted-foreground uppercase tracking-[0.14em]">
											{row.label}
										</p>
										<p className="text-neutral-900 text-sm leading-relaxed dark:text-white">
											{row.values[column.key]}
										</p>
									</div>
								))}
							</div>
						</div>
					))}
				</div>

				<div className="hidden overflow-hidden rounded-3xl border border-border bg-card md:block">
					<div className="grid grid-cols-[minmax(130px,0.8fr)_repeat(3,minmax(0,1fr))]">
						<div className="border-border border-b bg-background p-6" />
						{COMPARISON_COLUMNS.map((column) => (
							<div
								key={column.key}
								className={`border-border border-b border-l p-6 ${
									column.featured
										? "rounded-t-3xl bg-muted/40 dark:bg-white/4"
										: "bg-background"
								}`}
							>
								<div className="flex items-center gap-2">
									<column.icon className="size-4 text-muted-foreground" />
									<h3 className="font-medium text-neutral-900 text-sm dark:text-white">
										{column.title}
									</h3>
								</div>
							</div>
						))}

						{COMPARISON_ROWS.map((row, index) => (
							<div key={row.label} className="contents">
								<div
									className={`border-border border-b p-5 ${
										index === COMPARISON_ROWS.length - 1 ? "border-b-0" : ""
									}`}
								>
									<p className="font-medium text-neutral-900 text-sm dark:text-white">
										{row.label}
									</p>
								</div>
								{COMPARISON_COLUMNS.map((column) => (
									<div
										key={`${row.label}-${column.key}`}
										className={`border-border border-b border-l p-5 ${
											column.featured
												? "bg-muted/40 dark:bg-white/4"
												: "bg-background"
										} ${
											index === COMPARISON_ROWS.length - 1 ? "border-b-0" : ""
										} ${
											column.featured && index === COMPARISON_ROWS.length - 1
												? "rounded-b-3xl"
												: ""
										}`}
									>
										<p className="text-muted-foreground text-sm leading-relaxed">
											{row.values[column.key]}
										</p>
									</div>
								))}
							</div>
						))}
					</div>
				</div>
			</section> */}
		</div>
	);
}
