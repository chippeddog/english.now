import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowLeft,
	Bookmark,
	CheckCircle2,
	ChevronRight,
	Flag,
	Info,
	Mic,
	Settings,
	Share2,
	Sparkles,
	Trash2,
	Volume2,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_session/session/$sessionId")({
	component: SessionFeedbackPage,
});

// =============================================================================
// MOCK DATA
// =============================================================================

const MOCK_FEEDBACK = {
	sessionId: "session-123",
	practiceType: "conversation" as const,
	completedAt: "Jan 8",
	duration: 120, // 2 minutes
	title: "English level check: developer work & daily life",
	tutor: "AI Tutor",

	scores: {
		overall: 97,
		grammar: 72,
		pronunciation: 24,
		fluency: 68,
		vocabulary: 85,
	},

	grammar: {
		score: 72,
		level: "intermediate" as const,
		mistakes: [
			{
				id: "1",
				original: "that you knocked",
				corrected: "for knocking",
				explanation:
					'The correct phrase is "for knocking", which properly uses the gerund form after "grateful to you for" to indicate the reason for gratitude.',
				category: "prepositions" as const,
				severity: "moderate" as const,
				context:
					"I am so grateful to you that you knocked me down with our car.",
				correctedContext:
					"I am so grateful to you for knocking me down with your car.",
			},
			{
				id: "2",
				original: "our",
				corrected: "your",
				explanation:
					'The pronoun "our" should be "your" to correctly refer to the possessor of the car in this context.',
				category: "pronouns" as const,
				severity: "minor" as const,
				context:
					"I am so grateful to you that you knocked me down with our car.",
				correctedContext:
					"I am so grateful to you for knocking me down with your car.",
			},
		],
		strengths: [
			"Good use of complex sentence structures",
			"Correct verb tenses in most cases",
		],
		summary:
			"In your conversations about physical appearance and personal experiences, you did well in describing your features and sharing thoughts. However, you sometimes missed using the correct articles before nouns.",
	},

	pronunciation: {
		score: 24,
		summary:
			"Compare your pronunciation with the coach's and work on improving it.",
		phonemes: [
			{
				phoneme: "/ə/",
				displayName: "Sound /ə/",
				words: [
					{ word: "company", score: 28, highlightIndex: 4 },
					{ word: "communicate", score: 59, highlightIndex: 1 },
					{ word: "developer", score: 74, highlightIndex: 6 },
				],
			},
			{
				phoneme: "/t/",
				displayName: "Sound /t/",
				words: [
					{ word: "different", score: 45, highlightIndex: 5 },
					{ word: "developer", score: 74, highlightIndex: 7 },
				],
			},
			{
				phoneme: "/ŋ/",
				displayName: "Sound /ŋ/",
				words: [
					{ word: "english", score: 30, highlightIndex: 1 },
					{ word: "think", score: 37, highlightIndex: 4 },
				],
			},
			{
				phoneme: "/k/",
				displayName: "Sound /k/",
				words: [{ word: "think", score: 37, highlightIndex: 4 }],
			},
			{
				phoneme: "/p/",
				displayName: "Sound /p/",
				words: [{ word: "improve", score: 52, highlightIndex: 2 }],
			},
		],
	},

	fluency: {
		score: 68,
		metrics: {
			wordsPerMinute: 85,
			pauseFrequency: 4,
			averagePauseDuration: 1.2,
			fillerWordCount: 3,
		},
		insights: [
			{
				type: "positive" as const,
				icon: "check" as const,
				title: "You didn't use filler words",
				description: null,
			},
			{
				type: "improvement" as const,
				icon: "warning" as const,
				title: "Try to shorten your pauses",
				metric: { current: 65, target: 100 },
			},
			{
				type: "improvement" as const,
				icon: "warning" as const,
				title: "Try to slow down, could be a little fast",
				metric: { current: 72, target: 100 },
			},
		],
		summary:
			"Your speech flow is good but could benefit from shorter pauses between thoughts.",
	},

	vocabulary: {
		score: 85,
		level: "intermediate" as const,
		wordsUsed: 156,
		uniqueWords: 89,
		suggestions: [
			{
				id: "1",
				category: "choose-different-word" as const,
				type: "Engagement" as const,
				original: "happy",
				suggestion: "Try using: delighted, pleased, thrilled",
			},
			{
				id: "2",
				category: "choose-different-word" as const,
				type: "Engagement" as const,
				original: "right",
				suggestion: "Try using: correct, accurate, appropriate",
			},
			{
				id: "3",
				category: "choose-different-word" as const,
				type: "Engagement" as const,
				original: "wrong",
				suggestion: "Try using: incorrect, inaccurate, mistaken",
			},
			{
				id: "4",
				category: "rephrase-sentence" as const,
				type: "Clarity" as const,
				original: "The less she knows, the better she sleeps.",
				suggestion:
					"Consider: The less information she has, the more peaceful her sleep.",
			},
			{
				id: "5",
				category: "rephrase-sentence" as const,
				type: "Clarity" as const,
				original: "Don't let your emotions control you.",
				suggestion:
					"Consider: Try not to let your emotions dictate your actions.",
			},
		],
		summary:
			"Good vocabulary range for your level. Consider using more varied synonyms to express ideas.",
	},

	transcript: [
		{
			id: "1",
			role: "assistant" as const,
			content:
				"Hey there. I'm Kyle. I'm here to chat and check your English level.",
			timestamp: "00:00",
		},
		{
			id: "2",
			role: "user" as const,
			content:
				"Hey Kyle, I'm Dmitro. I'm here to show my expertise in English.",
			timestamp: "00:09",
		},
		{
			id: "3",
			role: "assistant" as const,
			content:
				"Wow, dcf. I love that confidence. You sound really motivated to show what you can do in English. That's the best attitude for growth. So tell me, what kind of English situations do you want to be most comfortable in? Work, travel, or daily life?",
			timestamp: "00:18",
		},
		{
			id: "4",
			role: "user" as const,
			content:
				"I think in daily life. I worked in a big company, Touch company. I'm developer and we communicate every day there. And I'm here to improve my English.",
			timestamp: "00:44",
		},
		{
			id: "5",
			role: "assistant" as const,
			content:
				"You are on the right track. They'll is a contraction for they will, but in formal or clear communication, it's better to say they will to avoid confusion. Try that. That's awesome. DCFF Working in a big international company must help you practice English a lot. What kind of projects are you working on as a developer?",
			timestamp: "01:00",
		},
		{
			id: "6",
			role: "user" as const,
			content:
				"Especially it's tiny indie apps and little setups and some extensions and some automations software, I don't know different.",
			timestamp: "01:32",
		},
		{
			id: "7",
			role: "assistant" as const,
			content:
				"Ah, I see you work on small setups, extensions, and automations. Sounds like you handle a lot of detailed stuff. What part of your work do you enjoy the most? DCFF.",
			timestamp: "01:52",
		},
	],
};

function ScoreBadge({
	score,
	size = "md",
}: {
	score: number;
	size?: "sm" | "md" | "lg";
}) {
	const getColor = (s: number) => {
		if (s >= 80) return "bg-green-500 text-white";
		if (s >= 60) return "bg-yellow-500 text-white";
		if (s >= 40) return "bg-orange-500 text-white";
		return "bg-red-500 text-white";
	};

	const sizeClasses = {
		sm: "px-2 py-0.5 text-xs",
		md: "px-2.5 py-1 text-sm",
		lg: "px-3 py-1.5 text-base",
	};

	return (
		<span
			className={cn(
				"rounded-full font-semibold",
				getColor(score),
				sizeClasses[size],
			)}
		>
			{score}%
		</span>
	);
}

function WordCard({
	word,
	score,
	highlightIndex,
	onClick,
}: {
	word: string;
	score: number;
	highlightIndex: number;
	onClick?: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="flex w-full items-center justify-between rounded-xl bg-neutral-800 p-4 transition-colors hover:bg-neutral-700"
		>
			<span className="font-medium text-white">
				{word.split("").map((char, i) => (
					<span
						key={`${word}-char-${i}-${char}`}
						className={i === highlightIndex ? "text-lime-400" : ""}
					>
						{char}
					</span>
				))}
			</span>
			<div className="flex items-center gap-2">
				<ScoreBadge score={score} size="sm" />
				<ChevronRight className="size-4 text-gray-400" />
			</div>
		</button>
	);
}

function PhonemeSection({
	displayName,
	children,
}: {
	displayName: string;
	children: React.ReactNode;
}) {
	return (
		<div className="space-y-3">
			<h3 className="font-medium text-neutral-400 text-sm">{displayName}</h3>
			<div className="space-y-2">{children}</div>
		</div>
	);
}

function GrammarCorrectionCard({
	original,
	corrected,
	explanation,
}: {
	original: string;
	corrected: string;
	explanation: string;
}) {
	// Parse the correction to show inline
	const renderCorrectedSentence = () => {
		// In a real app, this would dynamically render based on original/corrected
		return (
			<p className="text-lg leading-relaxed">
				I am so grateful to you{" "}
				<span className="font-medium text-green-600">
					{corrected || "for knocking"}
				</span>{" "}
				<span className="text-red-400 line-through">
					{original || "that you knocked"}
				</span>{" "}
				me down with <span className="text-red-400 line-through">our</span>{" "}
				<span className="font-medium text-green-600">your</span> car.
			</p>
		);
	};

	return (
		<div
			className="rounded-2xl bg-white p-6"
			style={{
				boxShadow:
					"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
			}}
		>
			{/* Header */}
			<div className="mb-3 flex items-center gap-2 text-muted-foreground text-xs">
				<span>Correct the Sentence</span>
				<span>|</span>
				<span>Correctness</span>
			</div>

			{/* Correction display */}
			<div className="mb-4 flex items-start justify-between gap-4">
				{renderCorrectedSentence()}
				<div className="flex shrink-0 gap-1">
					<Button variant="ghost" size="icon" className="size-8">
						<Volume2 className="size-4" />
					</Button>
					<Button variant="ghost" size="icon" className="size-8">
						<Bookmark className="size-4" />
					</Button>
				</div>
			</div>

			{/* Explanation */}
			<p className="mb-5 text-muted-foreground">{explanation}</p>

			{/* Actions */}
			<div className="flex items-center gap-2">
				<Button className="rounded-xl bg-green-500 hover:bg-green-600">
					<Mic className="mr-1 size-4" />
					Practice
				</Button>
				<Button variant="outline" className="rounded-xl">
					Skip
				</Button>
				<Button variant="ghost" size="icon" className="ml-auto size-9">
					<Flag className="size-4" />
				</Button>
			</div>
		</div>
	);
}

function VocabularySuggestionCard({
	category,
	type,
	original,
	suggestion,
}: {
	category: string;
	type: string;
	original: string;
	suggestion: string;
}) {
	const isRephrase = category === "rephrase-sentence";

	return (
		<div
			className="rounded-2xl bg-white p-5"
			style={{
				boxShadow:
					"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
			}}
		>
			<div className="mb-2 flex items-center gap-2 text-muted-foreground text-xs">
				<span>
					{isRephrase ? "Rephrase sentence" : "Choose a different word"}
				</span>
				<span>|</span>
				<span>{type}</span>
			</div>
			<div className="flex items-center gap-2">
				<span className="size-2 rounded-full bg-blue-500" />
				<p className={cn("font-medium", isRephrase ? "text-amber-600" : "")}>
					{original}
				</p>
			</div>
			{suggestion && (
				<p className="mt-2 text-muted-foreground text-sm">{suggestion}</p>
			)}
		</div>
	);
}

function InsightItem({
	type,
	title,
	metric,
}: {
	type: "positive" | "improvement" | "tip";
	title: string;
	metric?: { current: number; target: number };
}) {
	return (
		<div className="flex items-center justify-between rounded-xl bg-neutral-50 p-3">
			<div className="flex items-center gap-3">
				{type === "positive" ? (
					<CheckCircle2 className="size-5 text-green-500" />
				) : (
					<Sparkles className="size-5 text-amber-500" />
				)}
				<span className="text-sm">{title}</span>
			</div>
			<div className="flex items-center gap-2">
				{metric && (
					<div className="h-1.5 w-16 overflow-hidden rounded-full bg-neutral-200">
						<div
							className="h-full rounded-full bg-green-500"
							style={{ width: `${metric.current}%` }}
						/>
					</div>
				)}
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button variant="ghost" size="icon" className="size-7">
								<Info className="size-4 text-muted-foreground" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>Learn more about this metric</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>
		</div>
	);
}

function TranscriptMessage({
	role,
	content,
	timestamp,
}: {
	role: "user" | "assistant";
	content: string;
	timestamp: string;
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
				<div className="mb-1 flex items-center gap-2">
					<span className="font-medium text-sm">
						{role === "assistant" ? "system" : "You"}
					</span>
					<span className="text-muted-foreground text-xs">{timestamp}</span>
				</div>
				<p className="text-sm leading-relaxed">{content}</p>
			</div>
		</div>
	);
}

// =============================================================================
// MAIN PAGE
// =============================================================================

function SessionFeedbackPage() {
	const { sessionId: _sessionId } = Route.useParams();
	const [activeTab, setActiveTab] = useState("pronunciation");
	const feedback = MOCK_FEEDBACK;
	// In real app, sessionId would be used to fetch feedback data

	return (
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
						<h1 className="font-semibold text-xl">{feedback.title}</h1>
						<p className="text-muted-foreground text-sm">
							{feedback.completedAt} • {Math.floor(feedback.duration / 60)}m •{" "}
							{feedback.tutor}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" className="gap-2 rounded-xl">
						<Volume2 className="size-4" />
						Voices
					</Button>
					<Button variant="outline" className="gap-2 rounded-xl">
						<Share2 className="size-4" />
						Share
					</Button>
					<Button variant="ghost" size="icon" className="rounded-xl">
						<Settings className="size-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="rounded-xl text-red-500"
					>
						<Trash2 className="size-4" />
					</Button>
				</div>
			</div>

			{/* Main content */}
			<div className="flex gap-6">
				{/* Left panel - Transcript */}
				<div
					className="w-[420px] shrink-0 overflow-hidden rounded-2xl bg-white"
					style={{
						boxShadow:
							"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
					}}
				>
					<div className="max-h-[calc(100vh-200px)] space-y-6 overflow-y-auto p-6">
						{feedback.transcript.map((msg) => (
							<TranscriptMessage
								key={msg.id}
								role={msg.role}
								content={msg.content}
								timestamp={msg.timestamp}
							/>
						))}
					</div>
				</div>

				{/* Right panel - Feedback tabs */}
				<div className="flex-1">
					<Tabs
						value={activeTab}
						onValueChange={setActiveTab}
						className="w-full"
					>
						<div
							className="mb-4 rounded-2xl bg-white p-1"
							style={{
								boxShadow:
									"0 0 0 1px rgba(0,0,0,.05),0 2px 4px rgba(0,0,0,.04)",
							}}
						>
							<TabsList className="flex h-auto w-full items-center gap-0.5 rounded-2xl border border-border/50 bg-muted/50 p-0.5">
								<TabsTrigger
									value="pronunciation"
									className="flex h-[34px] cursor-pointer items-center justify-center rounded-xl px-2.5 font-medium text-muted-foreground text-sm italic transition-all"
								>
									Pronunciation
								</TabsTrigger>
								<TabsTrigger
									value="vocabulary"
									className="rounded-xl py-3 data-[state=active]:bg-neutral-100"
								>
									Vocabulary
								</TabsTrigger>
								<TabsTrigger
									value="grammar"
									className="rounded-xl py-3 data-[state=active]:bg-neutral-100"
								>
									Grammar
								</TabsTrigger>
								<TabsTrigger
									value="fluency"
									className="rounded-xl py-3 data-[state=active]:bg-neutral-100"
								>
									Fluency
								</TabsTrigger>
							</TabsList>
						</div>

						{/* Pronunciation Tab */}
						<TabsContent value="pronunciation" className="mt-0">
							<div className="flex gap-6">
								{/* Pronunciation feedback */}
								<div
									className="flex-1 rounded-2xl bg-neutral-900 p-6 text-white"
									style={{
										boxShadow:
											"0 0 0 1px rgba(0,0,0,.1),0 10px 10px -5px rgba(0,0,0,.1)",
									}}
								>
									<div className="mb-4 flex items-center justify-between">
										<h2 className="font-semibold text-lg">Pronunciation</h2>
										<ScoreBadge score={feedback.pronunciation.score} />
									</div>
									<p className="mb-6 text-neutral-400 text-sm">
										{feedback.pronunciation.summary}
									</p>

									<div className="space-y-6">
										{feedback.pronunciation.phonemes.map((group) => (
											<PhonemeSection
												key={group.phoneme}
												phoneme={group.phoneme}
												displayName={group.displayName}
											>
												{group.words.map((word) => (
													<WordCard
														key={word.word}
														word={word.word}
														score={word.score}
														highlightIndex={word.highlightIndex}
													/>
												))}
											</PhonemeSection>
										))}
									</div>
								</div>

								{/* Score panel */}
								<div className="w-72 shrink-0 space-y-4">
									<ScorePanel scores={feedback.scores} />
									<InsightsPanel insights={feedback.fluency.insights} />
								</div>
							</div>
						</TabsContent>

						{/* Vocabulary Tab */}
						<TabsContent value="vocabulary" className="mt-0">
							<div className="flex gap-6">
								<div className="flex-1 space-y-4">
									{feedback.vocabulary.suggestions.map((suggestion) => (
										<VocabularySuggestionCard
											key={suggestion.id}
											category={suggestion.category}
											type={suggestion.type}
											original={suggestion.original}
											suggestion={suggestion.suggestion}
										/>
									))}
								</div>
								<div className="w-72 shrink-0 space-y-4">
									<ScorePanel scores={feedback.scores} />
									<InsightsPanel insights={feedback.fluency.insights} />
								</div>
							</div>
						</TabsContent>

						{/* Grammar Tab */}
						<TabsContent value="grammar" className="mt-0">
							<div className="flex gap-6">
								<div className="flex-1 space-y-4">
									{feedback.grammar.mistakes.map((mistake) => (
										<GrammarCorrectionCard
											key={mistake.id}
											original={mistake.original}
											corrected={mistake.corrected}
											explanation={mistake.explanation}
										/>
									))}

									{/* Grammar summary */}
									<div
										className="rounded-2xl bg-white p-6"
										style={{
											boxShadow:
												"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
										}}
									>
										<div className="mb-3 flex items-center gap-2">
											<h3 className="font-semibold">Grammar</h3>
											<Badge variant="B1">Intermediate</Badge>
										</div>
										<p className="text-muted-foreground text-sm leading-relaxed">
											{feedback.grammar.summary}
										</p>
									</div>
								</div>
								<div className="w-72 shrink-0 space-y-4">
									<ScorePanel scores={feedback.scores} />
									<InsightsPanel insights={feedback.fluency.insights} />
								</div>
							</div>
						</TabsContent>

						{/* Fluency Tab */}
						<TabsContent value="fluency" className="mt-0">
							<div className="flex gap-6">
								<div className="flex-1">
									<div
										className="rounded-2xl bg-white p-6"
										style={{
											boxShadow:
												"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
										}}
									>
										<div className="mb-4 flex items-center justify-between">
											<h2 className="font-semibold text-lg">Fluency</h2>
											<ScoreBadge score={feedback.fluency.score} />
										</div>

										{/* Metrics */}
										<div className="mb-6 grid grid-cols-2 gap-4">
											<div className="rounded-xl bg-neutral-50 p-4">
												<p className="mb-1 text-muted-foreground text-sm">
													Words per minute
												</p>
												<p className="font-semibold text-2xl">
													{feedback.fluency.metrics.wordsPerMinute}
												</p>
											</div>
											<div className="rounded-xl bg-neutral-50 p-4">
												<p className="mb-1 text-muted-foreground text-sm">
													Pauses per minute
												</p>
												<p className="font-semibold text-2xl">
													{feedback.fluency.metrics.pauseFrequency}
												</p>
											</div>
											<div className="rounded-xl bg-neutral-50 p-4">
												<p className="mb-1 text-muted-foreground text-sm">
													Avg. pause duration
												</p>
												<p className="font-semibold text-2xl">
													{feedback.fluency.metrics.averagePauseDuration}s
												</p>
											</div>
											<div className="rounded-xl bg-neutral-50 p-4">
												<p className="mb-1 text-muted-foreground text-sm">
													Filler words
												</p>
												<p className="font-semibold text-2xl">
													{feedback.fluency.metrics.fillerWordCount}
												</p>
											</div>
										</div>

										<p className="text-muted-foreground text-sm">
											{feedback.fluency.summary}
										</p>
									</div>
								</div>
								<div className="w-72 shrink-0 space-y-4">
									<ScorePanel scores={feedback.scores} />
									<InsightsPanel insights={feedback.fluency.insights} />
								</div>
							</div>
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</div>
	);
}

// =============================================================================
// SIDE PANELS
// =============================================================================

function ScorePanel({ scores }: { scores: typeof MOCK_FEEDBACK.scores }) {
	return (
		<div
			className="rounded-2xl bg-white p-5"
			style={{
				boxShadow:
					"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
			}}
		>
			<div className="mb-4 flex items-center justify-between">
				<div className="flex items-center gap-3">
					<span className="text-muted-foreground text-sm">Score</span>
					<span className="rounded-full bg-green-100 px-3 py-1 font-bold text-green-700 text-lg">
						{scores.overall}
					</span>
				</div>
				<div className="flex items-center gap-2 text-muted-foreground text-sm">
					<span>Transcript</span>
					<span>0 of 6</span>
					<div className="h-1.5 w-12 rounded-full bg-neutral-200" />
					<span>0%</span>
				</div>
			</div>

			<div className="space-y-2">
				<ScoreRow label="Correctness" rank={1} color="red" />
				<ScoreRow label="Engagement" rank={3} color="yellow" />
				<ScoreRow label="Clarity" rank={2} color="yellow" />
			</div>
		</div>
	);
}

function ScoreRow({
	label,
	rank,
	color,
}: {
	label: string;
	rank: number;
	color: "red" | "yellow" | "green";
}) {
	return (
		<div className="flex items-center justify-between rounded-xl bg-neutral-50 p-3">
			<div className="flex items-center gap-2">
				<span
					className={cn(
						"flex size-6 items-center justify-center rounded-full font-bold text-white text-xs",
						color === "red" && "bg-red-500",
						color === "yellow" && "bg-yellow-500",
						color === "green" && "bg-green-500",
					)}
				>
					{rank}
				</span>
				<span className="text-sm">{label}</span>
			</div>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button variant="ghost" size="icon" className="size-7">
							<Info className="size-4 text-muted-foreground" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Learn more about {label.toLowerCase()}</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</div>
	);
}

function InsightsPanel({
	insights,
}: {
	insights: typeof MOCK_FEEDBACK.fluency.insights;
}) {
	return (
		<div
			className="rounded-2xl bg-white p-5"
			style={{
				boxShadow:
					"0 0 0 1px rgba(0,0,0,.05),0 10px 10px -5px rgba(0,0,0,.04),0 20px 25px -5px rgba(0,0,0,.04),0 20px 32px -12px rgba(0,0,0,.04)",
			}}
		>
			<div className="space-y-2">
				{insights.map((insight) => (
					<InsightItem
						key={insight.title}
						type={insight.type}
						title={insight.title}
						metric={insight.metric}
					/>
				))}
			</div>
		</div>
	);
}
