import { useTranslation } from "@english.now/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	Bot,
	ChevronDownIcon,
	type LucideIcon,
	Sparkles,
	UserRound,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

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

const COLLAPSED_HEIGHT = 340;

export default function About() {
	const { t } = useTranslation("home");
	const [expanded, setExpanded] = useState(false);
	return (
		<div className="container relative z-10 mx-auto max-w-4xl px-4 py-2 pt-10 pb-18 md:pt-18">
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

			<div className="mx-auto mb-10 max-w-xl text-center md:mb-14">
				<h2 className="mb-4 font-bold font-lyon text-4xl tracking-tight md:text-5xl">
					{t("letter.title")}
				</h2>
				<p className="text-balance text-center text-muted-foreground text-sm md:mx-auto md:max-w-boundary-sm md:text-lg">
					{t("letter.subtitle")}
				</p>
			</div>
			<motion.div
				className="relative overflow-hidden px-4 pt-4 md:max-h-none! md:overflow-visible md:px-0"
				animate={{
					maxHeight: expanded ? 2000 : COLLAPSED_HEIGHT,
				}}
				initial={false}
				transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
			>
				<AnimatePresence>
					{!expanded && (
						<motion.div
							className="absolute inset-x-0 bottom-0 z-40 flex items-end justify-center bg-linear-to-t from-white via-white/90 to-transparent pb-5 md:hidden"
							style={{ height: 160 }}
							initial={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.3 }}
						>
							<button
								type="button"
								onClick={() => setExpanded(true)}
								className="flex items-center gap-1.5 rounded-full border bg-white px-4 py-2 font-medium text-sm shadow-sm transition-colors hover:bg-neutral-50 active:bg-neutral-100"
							>
								{t("letter.readMore")}
								<ChevronDownIcon className="size-4" />
							</button>
						</motion.div>
					)}
				</AnimatePresence>
				<div className="flex justify-center lg:gap-20">
					<div className="-mt-1.5 relative w-full shrink-0 lg:w-[74%]">
						<div
							className="-rotate-2 sm:-rotate-2 absolute inset-0 transform rounded-lg bg-neutral-50 shadow-3 dark:shadow-none dark:ring dark:ring-border-strong"
							style={{
								boxShadow:
									"rgba(103, 103, 103, 0.08) 0px 0px 0px 1px, rgba(103, 103, 103, 0.12) 0px 4px 16px 0px",
							}}
						/>
						<div
							className="absolute inset-0 rotate-2 transform rounded-lg bg-neutral-50 shadow-2 sm:rotate-2 dark:bg-(--gray-2) dark:shadow-none dark:ring dark:ring-border-strong"
							style={{
								boxShadow:
									"rgba(103, 103, 103, 0.08) 0px 0px 0px 1px, rgba(103, 103, 103, 0.12) 0px 4px 16px 0px",
							}}
						/>
						<div className="relative z-30 size-full rounded-lg bg-white px-5 py-8 shadow-xs sm:px-14 sm:py-10 dark:ring dark:ring-border-strong">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								width={44}
								height={44}
								aria-hidden="true"
								className="text-muted-foreground/40 dark:text-muted-foreground/70"
							>
								<path
									fill="currentColor"
									d="M30.632 33.25c4.345 0 7.868-3.526 7.868-7.875 0-4.35-3.523-7.875-7.868-7.875-1.085 0-2.12.22-3.06.618.187-.343.39-.666.608-.974 1.374-1.945 3.406-3.427 6.044-5.188a1.751 1.751 0 0 0 .485-2.427 1.747 1.747 0 0 0-2.424-.485c-2.606 1.74-5.164 3.538-6.96 6.078-1.845 2.611-2.787 5.85-2.56 10.301.026 4.327 3.538 7.827 7.867 7.827ZM11.4 33.25c4.346 0 7.868-3.526 7.868-7.875 0-4.35-3.522-7.875-7.867-7.875-1.086 0-2.12.22-3.061.618.187-.343.391-.666.609-.974 1.374-1.945 3.405-3.427 6.044-5.188a1.751 1.751 0 0 0 .485-2.427 1.747 1.747 0 0 0-2.425-.485c-2.606 1.74-5.164 3.538-6.959 6.078-1.845 2.611-2.788 5.85-2.56 10.301.025 4.327 3.538 7.827 7.867 7.827Z"
								/>
							</svg>
							<p className="mt-5 text-muted-foreground text-sm leading-relaxed md:mt-5 md:mb-8 md:text-base">
								{t("letter.greeting")} <br />
								<br />
								{t("letter.paragraph1")} <br />
								<br />
								{t("letter.thatsWhenItHitMe")}{" "}
								<span className="rounded-sm bg-[#D8FF76]/50 px-1 font-medium text-lime-700">
									{t("letter.highlight1")}
								</span>{" "}
								{t("letter.paragraph2")}
								<br />
								<br />
								{t("letter.paragraph3")}{" "}
								<span className="rounded-sm bg-[#D8FF76]/50 px-1 font-medium text-lime-700">
									{t("letter.highlight2")}
								</span>{" "}
								{t("letter.paragraph4")}
								<br />
								<br />
								{t("letter.isItCompletely")}{" "}
								<Link className="text-lime-700 underline" to="/login">
									{t("letter.freeToStart")}
								</Link>
								{t("letter.freeNote")}
								<br />
								<br />
								{t("letter.signOff")}
							</p>
							<div className="flex items-center gap-6">
								<p className="flex flex-col gap-1 font-medium text-sm md:text-base">
									<span className="flex items-center gap-2 font-medium">
										Dmytro Tihunov{" "}
										<a
											href="https://x.com/chippeddog"
											target="_blank"
											aria-label="X (Twitter)"
											rel="noopener"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												className="size-4.5"
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
									<span className="hidden text-muted-foreground text-sm md:inline">
										{t("letter.founderTitle")}
									</span>
								</p>
							</div>
						</div>
					</div>
				</div>
			</motion.div>

			{/* <section className="mx-auto mb-20 max-w-3xl">
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
			</section> */}

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
