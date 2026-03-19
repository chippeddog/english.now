import { createFileRoute } from "@tanstack/react-router";
import {
	BarChart3,
	BookOpen,
	CheckCircle2,
	CheckIcon,
	ClockIcon,
	Flame,
	Lock,
	Mic,
	PlayIcon,
	TrendingUp,
	Volume2,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_public/features")({
	component: RouteComponent,
});

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const CARD_SHADOW =
	"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)";

const BUBBLE_SHADOW =
	"0 0 0 1px #0000000f,0 1px 1px #00000010,inset 0 1px #fff,inset 0 -1px 1px #fff3,inset 0 1px 4px 1px #fff3,inset 0 -2px 1px 1px #0000000f,inset 0 20px 20px #00000002";

// ---------------------------------------------------------------------------
// Feature definitions
// ---------------------------------------------------------------------------

const features: {
	id: string;
	title: string;
	description: string;
	badge: string;
	demo: () => ReactNode;
}[] = [
	{
		id: "conversations",
		title: "AI Conversations",
		description:
			"Practice speaking with our AI tutor in real-life scenarios. Get instant feedback on your pronunciation and grammar.",
		badge: "Speaking",
		demo: ConversationsDemo,
	},
	{
		id: "feedback",
		title: "Instant Feedback",
		description:
			"Receive detailed corrections and explanations for every mistake. Learn why something is wrong, not just that it's wrong.",
		badge: "AI-Powered",
		demo: FeedbackDemo,
	},
	{
		id: "vocabulary",
		title: "Smart Vocabulary",
		description:
			"Build your vocabulary with spaced repetition. Words are introduced in context and reviewed at optimal intervals.",
		badge: "Learning",
		demo: VocabularyDemo,
	},
	{
		id: "progress",
		title: "Track Progress",
		description:
			"See your improvement over time with detailed analytics. Track streaks, accuracy, and areas that need work.",
		badge: "Analytics",
		demo: ProgressDemo,
	},
	{
		id: "pronunciation",
		title: "Pronunciation Coach",
		description:
			"Perfect your accent with our speech recognition technology. Get word-by-word feedback on how to sound more natural.",
		badge: "Speaking",
		demo: PronunciationDemo,
	},
	{
		id: "lessons",
		title: "Personalized Lessons",
		description:
			"Lessons adapt to your level and goals. Whether you're preparing for a job interview or casual conversation.",
		badge: "Adaptive",
		demo: LessonsDemo,
	},
];

// ---------------------------------------------------------------------------
// 1. AI Conversations Demo
// ---------------------------------------------------------------------------

function ConversationsDemo() {
	return (
		<div
			className="flex w-full select-none flex-col overflow-hidden rounded-2xl bg-white"
			style={{ boxShadow: CARD_SHADOW }}
		>
			<div className="flex items-center gap-2 border-border/50 border-b px-4 py-2.5">
				<div className="relative size-7 overflow-hidden rounded-lg border border-[#C6F64D] bg-[radial-gradient(100%_100%_at_50%_0%,#EFFF9B_0%,#D8FF76_60%,#C6F64D_100%)]">
					<img
						className="absolute right-0 bottom-[-4px] left-0 mx-auto h-full w-full object-contain"
						src="/logo.svg"
						alt=""
						width={32}
						height={32}
					/>
				</div>
				<span className="font-semibold text-sm">Conversation</span>
			</div>

			<div className="space-y-3.5 p-4">
				{/* AI message */}
				<div className="max-w-[85%]">
					<div
						className="rounded-2xl rounded-tl-md bg-white px-3.5 py-2.5"
						style={{ boxShadow: BUBBLE_SHADOW }}
					>
						<p className="text-neutral-900 text-xs leading-relaxed">
							Let's practice ordering at a restaurant. What would you say to the
							waiter?
						</p>
						<div className="mt-1.5 flex items-center gap-1.5">
							<Button variant="outline" size="sm" className="size-6 rounded-lg">
								<PlayIcon fill="currentColor" className="size-2" />
							</Button>
							<Button variant="outline" size="sm" className="size-6 rounded-lg">
								<Volume2 className="size-2.5" />
							</Button>
						</div>
					</div>
				</div>

				{/* User message */}
				<div className="ml-auto max-w-[80%]">
					<div
						className="rounded-2xl rounded-tr-md bg-radial from-[#EFFF9B] to-[#D8FF76] px-3.5 py-2.5"
						style={{ boxShadow: BUBBLE_SHADOW }}
					>
						<p className="text-neutral-900 text-xs">
							I would like to order the pasta, please.
						</p>
					</div>
				</div>

				{/* AI response */}
				<div className="max-w-[85%]">
					<div
						className="rounded-2xl rounded-tl-md bg-white px-3.5 py-2.5"
						style={{ boxShadow: BUBBLE_SHADOW }}
					>
						<p className="text-neutral-900 text-xs leading-relaxed">
							Great sentence! <span className="font-medium">98% accuracy</span>.
							Try adding "Could I" for a more natural tone.
						</p>
					</div>
				</div>

				{/* Input bar */}
				<div
					className="mx-auto flex w-fit items-center gap-1 rounded-2xl border bg-white p-1.5"
					style={{
						boxShadow:
							"rgba(162,166,171,0.2) 0 0 0 0 inset, rgba(162,166,171,0.2) 0 0 8px 2px inset",
					}}
				>
					<Button variant="ghost" size="sm" className="size-7 rounded-lg">
						<BookOpen className="size-3.5" />
					</Button>
					<Button
						size="sm"
						className="flex size-8 items-center justify-center rounded-lg border border-[#C6F64D] bg-radial from-[#EFFF9B] to-[#D8FF76]"
					>
						<Mic className="size-3.5 text-lime-900" />
					</Button>
					<Button variant="ghost" size="sm" className="size-7 rounded-lg">
						<Volume2 className="size-3.5" />
					</Button>
				</div>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// 2. Instant Feedback Demo
// ---------------------------------------------------------------------------

function FeedbackDemo() {
	return (
		<div
			className="flex w-full select-none flex-col gap-3 rounded-2xl bg-white p-4"
			style={{ boxShadow: CARD_SHADOW }}
		>
			<div className="flex items-center gap-1.5">
				<span className="font-semibold text-sm">Feedback</span>
				<span className="rounded-md bg-radial from-[#EFFF9B] to-[#D8FF76] px-1.5 py-[1.5px] font-medium text-[11px] text-black">
					AI
				</span>
			</div>

			{/* Corrected sentence */}
			<div className="rounded-xl border border-neutral-100 bg-neutral-50/60 p-3">
				<p className="mb-1 text-[10px] text-muted-foreground uppercase tracking-wider">
					Your sentence
				</p>
				<p className="text-xs leading-relaxed">
					I am so grateful{" "}
					<span className="rounded bg-rose-100 px-0.5 text-rose-600 line-through">
						that you knocked
					</span>{" "}
					<span className="rounded bg-lime-100 px-0.5 font-medium text-lime-700">
						for knocking
					</span>{" "}
					me down with{" "}
					<span className="rounded bg-rose-100 px-0.5 text-rose-600 line-through">
						our
					</span>{" "}
					<span className="rounded bg-lime-100 px-0.5 font-medium text-lime-700">
						your
					</span>{" "}
					car.
				</p>
			</div>

			{/* Rating cards */}
			<div className="flex flex-col gap-2">
				<div className="flex flex-col">
					<span className="w-fit rounded-t-md bg-[#D8FF76] px-1.5 py-0.5 font-semibold text-lime-700 text-xs">
						Fluency
					</span>
					<span className="rounded-b-md border-2 border-[#D8FF76] bg-[#D8FF76]/50 px-1.5 py-1 text-neutral-900 text-xs">
						Good use of everyday phrases. Natural rhythm.
					</span>
				</div>
				<div className="flex flex-col">
					<span className="w-fit rounded-t-md bg-amber-200 px-1.5 py-0.5 font-semibold text-amber-700 text-xs">
						Grammar
					</span>
					<span className="rounded-b-md border-2 border-amber-200 bg-amber-100/50 px-1.5 py-1 text-neutral-900 text-xs">
						Minor article error. Use "for + gerund" after "grateful."
					</span>
				</div>
				<div className="flex flex-col">
					<span className="w-fit rounded-t-md bg-blue-200 px-1.5 py-0.5 font-semibold text-blue-700 text-xs">
						Pronunciation
					</span>
					<span className="rounded-b-md border-2 border-blue-200 bg-blue-100/50 px-1.5 py-1 text-neutral-900 text-xs">
						Clear and easy to understand. Watch the "th" in "grateful."
					</span>
				</div>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// 3. Smart Vocabulary Demo
// ---------------------------------------------------------------------------

const vocabWords = [
	{
		word: "Eloquent",
		phonetic: "/ˈeləkwənt/",
		translation: "Elocuente",
		example: '"She gave an eloquent speech."',
		mastery: 0.85,
	},
	{
		word: "Resilient",
		phonetic: "/rɪˈzɪliənt/",
		translation: "Resistente",
		example: '"He remained resilient through hardships."',
		mastery: 0.6,
	},
	{
		word: "Ubiquitous",
		phonetic: "/juːˈbɪkwɪtəs/",
		translation: "Ubicuo",
		example: '"Smartphones are now ubiquitous."',
		mastery: 0.25,
	},
];

function MasteryRing({ progress }: { progress: number }) {
	const r = 8;
	const c = 2 * Math.PI * r;
	const offset = c - progress * c;
	if (progress >= 1) {
		return (
			<div className="flex size-5 items-center justify-center rounded-full bg-green-500 text-white">
				<CheckIcon className="size-3" strokeWidth={2.5} />
			</div>
		);
	}
	return (
		<svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
			<circle
				cx="12"
				cy="12"
				r={r}
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				className="text-neutral-200"
			/>
			{progress > 0 && (
				<circle
					cx="12"
					cy="12"
					r={r}
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeDasharray={`${c}`}
					strokeDashoffset={offset}
					transform="rotate(-90 12 12)"
					className="text-green-500"
				/>
			)}
		</svg>
	);
}

function VocabularyDemo() {
	return (
		<div
			className="flex w-full select-none flex-col gap-2.5 rounded-2xl bg-white p-4"
			style={{ boxShadow: CARD_SHADOW }}
		>
			<div className="mb-0.5 flex items-center justify-between">
				<h3 className="font-semibold text-sm">Today's Words</h3>
				<span className="text-muted-foreground text-xs">3/5 learned</span>
			</div>
			{vocabWords.map((item) => (
				<div
					key={item.word}
					className="flex items-center gap-2.5 rounded-xl border border-neutral-100 bg-white p-3"
				>
					<button
						type="button"
						className="flex size-8 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100"
					>
						<Volume2 className="size-4" />
					</button>
					<div className="min-w-0 flex-1">
						<div className="flex items-baseline gap-2">
							<span className="font-bold text-neutral-800 text-xs">
								{item.word}
							</span>
							<span className="text-[11px] text-neutral-400">
								{item.phonetic}
							</span>
						</div>
						<p className="mt-0.5 truncate text-muted-foreground text-xs">
							{item.example}
						</p>
					</div>
					<MasteryRing progress={item.mastery} />
				</div>
			))}
		</div>
	);
}

// ---------------------------------------------------------------------------
// 4. Track Progress Demo
// ---------------------------------------------------------------------------

const weekBars = [
	{ day: "Mon", value: 60, active: false },
	{ day: "Tue", value: 85, active: false },
	{ day: "Wed", value: 40, active: false },
	{ day: "Thu", value: 95, active: false },
	{ day: "Fri", value: 70, active: false },
	{ day: "Sat", value: 50, active: false },
	{ day: "Sun", value: 30, active: true },
];

function ProgressDemo() {
	return (
		<div className="flex w-full select-none flex-col gap-3">
			{/* Stat cards */}
			<div className="grid grid-cols-3 gap-2">
				{[
					{
						icon: Flame,
						label: "Streak",
						value: "12 days",
						color: "text-orange-500",
						bg: "bg-orange-50",
					},
					{
						icon: TrendingUp,
						label: "Accuracy",
						value: "87%",
						color: "text-lime-600",
						bg: "bg-lime-50",
					},
					{
						icon: BarChart3,
						label: "Words",
						value: "248",
						color: "text-blue-500",
						bg: "bg-blue-50",
					},
				].map((stat) => (
					<div
						key={stat.label}
						className="flex flex-col items-center gap-1 rounded-xl bg-white p-3"
						style={{ boxShadow: CARD_SHADOW }}
					>
						<div
							className={cn(
								"flex size-7 items-center justify-center rounded-lg",
								stat.bg,
							)}
						>
							<stat.icon className={cn("size-3.5", stat.color)} />
						</div>
						<span className="font-bold text-neutral-800 text-sm">
							{stat.value}
						</span>
						<span className="text-[10px] text-muted-foreground">
							{stat.label}
						</span>
					</div>
				))}
			</div>

			{/* Weekly chart */}
			<div
				className="rounded-2xl bg-white p-4"
				style={{ boxShadow: CARD_SHADOW }}
			>
				<div className="mb-3 flex items-center justify-between">
					<h3 className="font-semibold text-xs">This Week</h3>
					<span className="text-[10px] text-muted-foreground">
						4h 30m total
					</span>
				</div>
				<div className="flex items-end justify-between gap-1.5">
					{weekBars.map((bar) => (
						<div
							key={bar.day}
							className="flex flex-1 flex-col items-center gap-1.5"
						>
							<div className="relative h-[80px] w-full">
								<div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[20px] overflow-hidden rounded-t-md">
									<div
										className={cn(
											"w-full rounded-t-md transition-all",
											bar.active
												? "bg-radial from-[#EFFF9B] to-[#C6F64D]"
												: "bg-neutral-100",
										)}
										style={{ height: `${bar.value * 0.8}px` }}
									/>
								</div>
							</div>
							<span
								className={cn(
									"text-[10px]",
									bar.active
										? "font-semibold text-neutral-800"
										: "text-muted-foreground",
								)}
							>
								{bar.day}
							</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// 5. Pronunciation Coach Demo
// ---------------------------------------------------------------------------

const pronWords = [
	{ text: "I", score: 98, color: "text-green-600" },
	{ text: "would", score: 95, color: "text-green-600" },
	{ text: "like", score: 92, color: "text-green-600" },
	{ text: "to", score: 88, color: "text-lime-600" },
	{ text: "order", score: 72, color: "text-amber-600" },
	{ text: "the", score: 96, color: "text-green-600" },
	{ text: "pasta", score: 54, color: "text-rose-500" },
];

function PronunciationDemo() {
	return (
		<div className="flex w-full select-none flex-col gap-3">
			{/* Waveform card */}
			<div
				className="rounded-2xl bg-white p-4"
				style={{ boxShadow: CARD_SHADOW }}
			>
				<div className="mb-3 flex items-center justify-between">
					<h3 className="font-semibold text-sm">Your Recording</h3>
					<span className="rounded-full bg-lime-100 px-2 py-0.5 font-semibold text-lime-700 text-xs">
						86%
					</span>
				</div>
				{/* Fake waveform */}
				<div className="mb-3 flex items-center justify-center gap-[2px]">
					{Array.from({ length: 32 }).map((_, i) => {
						const h =
							8 +
							Math.abs(Math.sin(i * 0.5) * 20) +
							Math.abs(Math.cos(i * 0.3) * 12);
						return (
							<div
								key={`bar-${i.toString()}`}
								className="w-[3px] rounded-full bg-radial from-[#EFFF9B] to-[#C6F64D]"
								style={{ height: `${h}px` }}
							/>
						);
					})}
				</div>
				<div className="flex items-center justify-center gap-2">
					<Button
						variant="outline"
						size="sm"
						className="h-7 rounded-lg text-xs"
					>
						<PlayIcon fill="currentColor" className="mr-1 size-2.5" />
						Play
					</Button>
					<Button
						size="sm"
						className="h-7 rounded-lg border border-[#C6F64D] bg-radial from-[#EFFF9B] to-[#D8FF76] text-lime-900 text-xs shadow-none hover:brightness-95"
					>
						<Mic className="mr-1 size-3" />
						Retry
					</Button>
				</div>
			</div>

			{/* Word-by-word breakdown */}
			<div
				className="rounded-2xl bg-white p-4"
				style={{ boxShadow: CARD_SHADOW }}
			>
				<p className="mb-2.5 text-[10px] text-muted-foreground uppercase tracking-wider">
					Word-by-word
				</p>
				<div className="flex flex-wrap gap-1.5">
					{pronWords.map((w) => (
						<div
							key={w.text}
							className="flex flex-col items-center gap-0.5 rounded-lg border border-neutral-100 px-2.5 py-1.5"
						>
							<span className={cn("font-semibold text-sm", w.color)}>
								{w.text}
							</span>
							<span className="text-[9px] text-muted-foreground">
								{w.score}%
							</span>
						</div>
					))}
				</div>
				<div className="mt-3 rounded-lg bg-amber-50 p-2.5">
					<p className="text-amber-800 text-xs leading-relaxed">
						<span className="font-semibold">Tip:</span> The "a" in "pasta"
						should sound like /ɑː/, not /æ/. Try opening your mouth wider.
					</p>
				</div>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// 6. Personalized Lessons Demo
// ---------------------------------------------------------------------------

const lessonItems = [
	{
		title: "Greetings & Introductions",
		status: "completed" as const,
		progress: 100,
	},
	{
		title: "Ordering at a Restaurant",
		status: "completed" as const,
		progress: 100,
	},
	{
		title: "Job Interview Basics",
		status: "current" as const,
		progress: 45,
	},
	{
		title: "Business Email Writing",
		status: "locked" as const,
		progress: 0,
	},
];

function LessonsDemo() {
	return (
		<div className="flex w-full select-none flex-col gap-3">
			{/* Level header */}
			<div
				className="flex items-center gap-3 rounded-2xl bg-white p-4"
				style={{ boxShadow: CARD_SHADOW }}
			>
				<div className="relative flex size-11 items-center justify-center">
					<svg className="size-11" viewBox="0 0 56 56" aria-hidden="true">
						<title>Level</title>
						<circle
							cx="28"
							cy="28"
							r="24"
							fill="none"
							stroke="currentColor"
							strokeWidth="4"
							className="text-neutral-100"
						/>
						<circle
							cx="28"
							cy="28"
							r="24"
							fill="none"
							stroke="currentColor"
							strokeWidth="4"
							strokeLinecap="round"
							strokeDasharray={`${(45 / 100) * 150.8} 150.8`}
							transform="rotate(-90 28 28)"
							className="text-lime-500"
						/>
					</svg>
					<span className="absolute font-bold text-[10px]">45%</span>
				</div>
				<div>
					<h3 className="font-semibold text-sm">Beginner A1</h3>
					<p className="text-muted-foreground text-xs">
						Reach 50% to unlock{" "}
						<span className="font-semibold text-foreground">A2</span>
					</p>
				</div>
				<div className="ml-auto text-right">
					<span className="font-bold text-lg">4</span>
					<span className="text-muted-foreground text-xs"> / 24</span>
					<p className="text-[10px] text-muted-foreground">lessons</p>
				</div>
			</div>

			{/* Lesson list */}
			<div
				className="flex flex-col rounded-2xl bg-white"
				style={{ boxShadow: CARD_SHADOW }}
			>
				{lessonItems.map((lesson, i) => (
					<div
						key={lesson.title}
						className={cn(
							"flex items-center gap-3 px-4 py-3",
							i < lessonItems.length - 1 && "border-neutral-100 border-b",
							lesson.status === "locked" && "opacity-50",
						)}
					>
						<div
							className={cn(
								"flex size-7 shrink-0 items-center justify-center rounded-full border",
								lesson.status === "completed"
									? "border-lime-400 bg-lime-100 text-lime-600"
									: lesson.status === "current"
										? "border-amber-400 bg-amber-100 text-amber-600"
										: "border-neutral-200 bg-neutral-100 text-neutral-400",
							)}
						>
							{lesson.status === "completed" ? (
								<CheckIcon className="size-3.5 stroke-[2.5]" />
							) : lesson.status === "current" ? (
								<ClockIcon className="size-3.5" />
							) : (
								<Lock className="size-3" />
							)}
						</div>
						<span
							className={cn(
								"flex-1 text-xs",
								lesson.status === "locked"
									? "text-neutral-400"
									: "font-medium text-neutral-800",
							)}
						>
							{lesson.title}
						</span>
						{lesson.status === "current" && (
							<div className="h-1.5 w-16 overflow-hidden rounded-full bg-neutral-100">
								<div
									className="h-full rounded-full bg-radial from-[#EFFF9B] to-[#C6F64D]"
									style={{ width: `${lesson.progress}%` }}
								/>
							</div>
						)}
						{lesson.status === "completed" && (
							<CheckCircle2 className="size-4 text-lime-500" />
						)}
					</div>
				))}
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Feature Block (background kept exactly as-is)
// ---------------------------------------------------------------------------

function FeatureBlock({
	feature,
	reverse = false,
}: {
	feature: (typeof features)[number];
	reverse?: boolean;
}) {
	return (
		<div
			className={`flex w-full flex-col gap-4 md:gap-6 lg:flex-row lg:items-center ${reverse ? "lg:flex-row-reverse" : ""}`}
		>
			{/* Content - 1/2 width */}
			<div className="flex flex-1 shrink-0 flex-col lg:w-1/2 lg:max-w-none">
				<h2 className="mb-4 font-bold font-lyon text-3xl tracking-tight md:text-4xl">
					{feature.title}
				</h2>
				<p className="text-lg text-muted-foreground leading-relaxed">
					{feature.description}
				</p>
			</div>

			{/* Visual container - 1/2 width (background untouched) */}
			<div className="relative min-h-[400px] w-full shrink-0 overflow-hidden rounded-t-3xl border border-border/50 lg:w-1/2">
				<div
					className="absolute inset-1 h-full w-full rounded-tl-[1.25rem] px-6 py-6 pt-4 pl-4"
					style={{
						background:
							"radial-gradient(92.09% 124.47% at 50% 99.24%, rgba(245, 245, 245, 0.80) 58.91%, rgba(245, 245, 245, 0.40) 100%)",
						boxShadow:
							"1.899px 1.77px 8.174px 0 rgba(255, 255, 255, 0.13) inset, 1.007px 0.939px 4.087px 0 rgba(255, 255, 255, 0.13) inset",
						mixBlendMode: "plus-lighter",
					}}
				>
					<div className="relative z-10">
						<feature.demo />
					</div>
				</div>
			</div>
		</div>
	);
}

function RouteComponent() {
	return (
		<div className="container relative z-10 mx-auto max-w-5xl px-4 py-2 pt-10 md:pt-18">
			<div className="mb-16 flex flex-col items-center gap-4 text-center">
				<h1 className="font-bold font-lyon text-4xl text-neutral-900 tracking-tight md:text-5xl dark:text-white">
					Everything you need <br className="md:hidden" /> to master English
				</h1>
				<p className="mx-auto text-balance text-muted-foreground md:text-lg">
					All plans include access to our AI-powered learning tools.
				</p>
			</div>
			<div className="space-y-24 pb-20 md:space-y-32">
				{features.map((feature, index) => (
					<FeatureBlock
						key={feature.id}
						feature={feature}
						reverse={index % 2 === 1}
					/>
				))}
			</div>
		</div>
	);
}
