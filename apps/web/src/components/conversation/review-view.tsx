import type { AppRouter } from "@english.now/api/routers/index";
import { Link } from "@tanstack/react-router";
import type { inferRouterOutputs } from "@trpc/server";
import {
	ArrowLeft,
	BookOpen,
	Check,
	ChevronRight,
	Loader2,
	MessageSquare,
	Mic,
	Share2,
	Sparkles,
	TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatRelativeDate } from "@/utils/date";

type FeedbackResponse =
	inferRouterOutputs<AppRouter>["feedback"]["getFeedback"];
type FeedbackData = FeedbackResponse["feedback"];

type GenerationStep = {
	id: string;
	label: string;
	icon: typeof Sparkles;
	delay: number;
};

const STEPS: GenerationStep[] = [
	{
		id: "pronunciation",
		label: "Analyzing pronunciation",
		icon: Mic,
		delay: 0,
	},
	{ id: "grammar", label: "Checking grammar", icon: BookOpen, delay: 2000 },
	{
		id: "vocabulary",
		label: "Evaluating vocabulary",
		icon: MessageSquare,
		delay: 4000,
	},
	{ id: "fluency", label: "Assessing fluency", icon: TrendingUp, delay: 6000 },
	{
		id: "summary",
		label: "Preparing your feedback",
		icon: Sparkles,
		delay: 8000,
	},
];

function TranscriptMessage({
	content,
	role,
}: {
	content: string;
	role: "user" | "assistant";
}) {
	return (
		<div className="flex gap-3">
			<div className="flex shrink-0 flex-col items-center gap-1">
				<div
					className={cn(
						"flex size-8 items-center justify-center rounded-full font-medium text-xs",
						role === "assistant"
							? "bg-neutral-200 text-neutral-600"
							: "bg-lime-100 text-lime-700",
					)}
				>
					{role === "assistant" ? "AI" : "You"}
				</div>
			</div>
			<div className="flex-1">
				<p className="text-sm leading-relaxed">{content}</p>
			</div>
		</div>
	);
}

function ScoreRing({
	score,
	size = 80,
	strokeWidth = 6,
	className,
	label,
}: {
	score: number;
	size?: number;
	strokeWidth?: number;
	className?: string;
	label?: string;
}) {
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	const offset = circumference - (score / 100) * circumference;

	const getColor = (s: number) => {
		if (s >= 80)
			return { stroke: "#22c55e", bg: "bg-green-50", text: "text-green-700" };
		if (s >= 60)
			return { stroke: "#84cc16", bg: "bg-lime-50", text: "text-lime-700" };
		if (s >= 40)
			return { stroke: "#eab308", bg: "bg-yellow-50", text: "text-yellow-700" };
		return { stroke: "#ef4444", bg: "bg-red-50", text: "text-red-700" };
	};

	const color = getColor(score);

	return (
		<div className={cn("flex flex-col items-center gap-2", className)}>
			<div className="relative" style={{ width: size, height: size }}>
				<svg
					width={size}
					height={size}
					className="-rotate-90"
					aria-hidden="true"
				>
					<title>Score</title>
					<circle
						cx={size / 2}
						cy={size / 2}
						r={radius}
						fill="none"
						stroke="currentColor"
						strokeWidth={strokeWidth}
						className="text-muted/30"
					/>
					<circle
						cx={size / 2}
						cy={size / 2}
						r={radius}
						fill="none"
						stroke={color.stroke}
						strokeWidth={strokeWidth}
						strokeDasharray={circumference}
						strokeDashoffset={offset}
						strokeLinecap="round"
						className="transition-all duration-1000 ease-out"
					/>
				</svg>
				<div className="absolute inset-0 flex items-center justify-center">
					<span className={cn("font-bold text-lg", color.text)}>{score}</span>
				</div>
			</div>
			{label && (
				<span className="text-center font-medium text-muted-foreground text-xs">
					{label}
				</span>
			)}
		</div>
	);
}

function CorrectionBadge({ type }: { type: string }) {
	const config: Record<string, { label: string; className: string }> = {
		grammar: { label: "Grammar", className: "bg-blue-100 text-blue-700" },
		vocabulary: {
			label: "Vocabulary",
			className: "bg-purple-100 text-purple-700",
		},
		pronunciation: {
			label: "Pronunciation",
			className: "bg-amber-100 text-amber-700",
		},
		fluency: { label: "Fluency", className: "bg-emerald-100 text-emerald-700" },
	};
	const c = config[type] ?? {
		label: type,
		className: "bg-gray-100 text-gray-700",
	};
	return (
		<span
			className={cn(
				"rounded-full px-2 py-0.5 font-medium text-[10px]",
				c.className,
			)}
		>
			{c.label}
		</span>
	);
}

export function LoadingState() {
	const [activeStep, setActiveStep] = useState(0);

	useEffect(() => {
		const timers = STEPS.map((step, i) =>
			setTimeout(() => setActiveStep(i), step.delay),
		);
		return () => timers.forEach(clearTimeout);
	}, []);

	return (
		<div className="flex min-h-dvh flex-col items-center justify-center bg-neutral-50 p-6">
			<div className="w-full max-w-md space-y-8">
				<div className="space-y-2 text-center">
					<h1 className="font-bold text-2xl tracking-tight">
						Analyzing Your Session
					</h1>
					<p className="text-muted-foreground text-sm">
						We're evaluating your conversation performance. This takes about 15
						seconds.
					</p>
				</div>

				<div className="space-y-3">
					{STEPS.map((step, i) => {
						const Icon = step.icon;
						const status =
							i < activeStep
								? "completed"
								: i === activeStep
									? "active"
									: "pending";
						return (
							<div
								key={step.id}
								className={cn(
									"flex items-center gap-3 rounded-lg border p-3 transition-all duration-300",
									status === "active" && "border-lime-500/50 bg-lime-50",
									status === "completed" && "border-green-500/30 bg-green-50",
									status === "pending" && "border-transparent opacity-50",
								)}
							>
								<div
									className={cn(
										"flex size-8 items-center justify-center rounded-full",
										status === "active" && "bg-lime-100 text-lime-600",
										status === "completed" && "bg-green-100 text-green-600",
										status === "pending" && "bg-muted text-muted-foreground",
									)}
								>
									{status === "active" ? (
										<Loader2 className="size-4 animate-spin" />
									) : status === "completed" ? (
										<Check className="size-4" />
									) : (
										<Icon className="size-4" />
									)}
								</div>
								<span
									className={cn(
										"font-medium text-sm",
										status === "completed" && "text-green-700",
										status === "pending" && "text-muted-foreground",
									)}
								>
									{step.label}
								</span>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}

export default function ReviewView({
	feedback,
	messages,
	session,
}: {
	feedback: FeedbackData;
	messages: FeedbackResponse["messages"];
	session: FeedbackResponse["session"];
}) {
	const scores = [
		{ label: "Grammar", score: feedback.grammarScore },
		{ label: "Vocabulary", score: feedback.vocabularyScore },
		{ label: "Fluency", score: feedback.fluencyScore },
		{ label: "Pronunciation", score: feedback.pronunciationScore },
	].filter((s) => s.score != null) as { label: string; score: number }[];

	return (
		<div className="min-h-dvh bg-neutral-50">
			<div className="container mx-auto max-w-5xl px-4 py-6">
				{/* Header */}
				<div className="mb-6 flex items-center justify-between">
					<div className="flex items-center gap-4">
						<Link to="/practice">
							<Button variant="ghost" size="icon" className="rounded-xl">
								<ArrowLeft className="size-5" />
							</Button>
						</Link>
						<div>
							<h1 className="font-semibold text-xl">{session.scenario}</h1>
							<p className="text-muted-foreground text-sm">
								{formatRelativeDate(new Date(session.createdAt))}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Button variant="outline" className="gap-2 rounded-xl">
							<Share2 className="size-4" />
							Share
						</Button>
					</div>
				</div>

				<div className="grid grid-cols-5 items-start gap-6">
					{/* Left panel - Transcript */}
					<div
						className="col-span-3 shrink-0 rounded-2xl bg-white"
						style={{
							boxShadow:
								"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
						}}
					>
						<div className="max-h-[calc(100vh-200px)] space-y-6 overflow-y-auto p-6">
							{messages.map((msg) => (
								<TranscriptMessage
									key={msg.id}
									content={msg.content}
									role={msg.role as "user" | "assistant"}
								/>
							))}
						</div>
					</div>

					<div className="col-span-2 space-y-6">
						{/* Overall score */}
						{feedback.overallScore != null && (
							<div className="flex flex-col items-center gap-3 rounded-2xl border bg-white p-6">
								<ScoreRing
									score={feedback.overallScore}
									size={100}
									strokeWidth={8}
								/>
								<div className="text-center">
									<p className="font-semibold text-lg">Overall Score</p>
									<p className="text-muted-foreground text-sm">
										{feedback.overallScore >= 80
											? "Excellent work!"
											: feedback.overallScore >= 60
												? "Good progress!"
												: feedback.overallScore >= 40
													? "Keep practicing!"
													: "Don't give up!"}
									</p>
								</div>
							</div>
						)}

						{/* Individual scores */}
						{scores.length > 0 && (
							<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
								{scores.map((s) => (
									<div
										key={s.label}
										className="flex flex-col items-center gap-1 rounded-xl border bg-white p-4"
									>
										<ScoreRing score={s.score} size={64} strokeWidth={5} />
										<span className="font-medium text-muted-foreground text-xs">
											{s.label}
										</span>
									</div>
								))}
							</div>
						)}

						{/* Summary */}
						{feedback.summary && (
							<div className="rounded-xl border bg-white p-5">
								<h2 className="mb-2 font-semibold text-sm">Summary</h2>
								<p className="text-muted-foreground text-sm leading-relaxed">
									{feedback.summary}
								</p>
							</div>
						)}

						{/* Strengths & Improvements */}
						<div className="grid gap-3 sm:grid-cols-2">
							{feedback.strengths && feedback.strengths.length > 0 && (
								<div className="rounded-xl border border-green-200 bg-green-50 p-5">
									<h2 className="mb-3 font-semibold text-green-800 text-sm">
										Strengths
									</h2>
									<ul className="space-y-2">
										{feedback.strengths.map((s) => (
											<li
												key={s}
												className="flex items-start gap-2 text-green-700 text-sm"
											>
												<Check className="mt-0.5 size-3.5 shrink-0" />
												<span>{s}</span>
											</li>
										))}
									</ul>
								</div>
							)}

							{feedback.improvements && feedback.improvements.length > 0 && (
								<div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
									<h2 className="mb-3 font-semibold text-amber-800 text-sm">
										Areas to Improve
									</h2>
									<ul className="space-y-2">
										{feedback.improvements.map((imp) => (
											<li
												key={imp}
												className="flex items-start gap-2 text-amber-700 text-sm"
											>
												<ChevronRight className="mt-0.5 size-3.5 shrink-0" />
												<span>{imp}</span>
											</li>
										))}
									</ul>
								</div>
							)}
						</div>

						{/* Corrections */}
						{feedback.corrections && feedback.corrections.length > 0 && (
							<div className="rounded-xl border bg-white p-5">
								<h2 className="mb-3 font-semibold text-sm">Corrections</h2>
								<div className="space-y-3">
									{feedback.corrections.map((correction, i) => (
										<div
											key={`${correction.original}-${i}`}
											className="rounded-lg border border-dashed p-3"
										>
											<div className="mb-2 flex items-center gap-2">
												<CorrectionBadge type={correction.type} />
											</div>
											<div className="space-y-1 text-sm">
												<p className="text-red-600 line-through">
													{correction.original}
												</p>
												<p className="font-medium text-green-700">
													{correction.corrected}
												</p>
												<p className="text-muted-foreground text-xs">
													{correction.explanation}
												</p>
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Vocabulary Suggestions */}
						{feedback.vocabularySuggestions &&
							feedback.vocabularySuggestions.length > 0 && (
								<div className="rounded-xl border bg-white p-5">
									<h2 className="mb-3 font-semibold text-sm">
										Vocabulary to Learn
									</h2>
									<div className="flex flex-wrap gap-2">
										{feedback.vocabularySuggestions.map((word) => (
											<span
												key={word}
												className="rounded-full border bg-neutral-50 px-3 py-1.5 text-sm"
											>
												{word}
											</span>
										))}
									</div>
								</div>
							)}
					</div>
				</div>
			</div>
		</div>
	);
}
