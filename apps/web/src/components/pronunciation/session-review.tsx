import { useNavigate } from "@tanstack/react-router";
import { ChevronLeft, RefreshCw, Trophy } from "lucide-react";
import { OverallScore, ScoreBreakdown } from "@/components/pronunciation/score";
import WeakPhonemesSection from "@/components/pronunciation/weak-phonemes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ReadAloudItem = {
	text: string;
	topic: string;
	phonemeFocus: string;
	tips: string;
};

type TongueTwisterItem = {
	text: string;
	speed: "slow" | "medium" | "fast";
	targetPhonemes: string[];
	tip: string;
};

type WeakPhoneme = {
	phoneme: string;
	score: number;
	occurrences: number;
	exampleWords: string[];
};

type SessionSummary = {
	averageScore: number;
	averageAccuracy: number;
	averageFluency: number;
	averageProsody: number;
	averageCompleteness: number;
	totalAttempts: number;
	bestScore: number;
	worstScore: number;
	weakWords: string[];
	weakPhonemes: WeakPhoneme[];
	itemScores: { itemIndex: number; bestScore: number; attempts: number }[];
};

const MODE_INFO: Record<string, { name: string; icon: string }> = {
	"read-aloud": { name: "Read Aloud", icon: "📖" },
	"tongue-twisters": { name: "Tongue Twisters", icon: "👅" },
};

export default function SessionReview({
	summary,
	mode,
	difficulty,
	items,
}: {
	summary: SessionSummary;
	mode: string;
	difficulty: string;
	items: ReadAloudItem[] | TongueTwisterItem[];
}) {
	const navigate = useNavigate();
	const modeInfo = MODE_INFO[mode];

	return (
		<div className="space-y-6">
			<div className="text-center">
				<div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
					<Trophy className="size-8 text-primary" />
				</div>
				<h2 className="font-bold font-lyon text-3xl tracking-tight">
					Session Complete
				</h2>
				<p className="mt-1 text-muted-foreground">
					{modeInfo?.name ?? mode} - {difficulty}
				</p>
			</div>

			{/* Overall Score */}
			<div className="rounded-2xl border bg-card p-8">
				<OverallScore score={summary.averageScore} />

				{/* Score Breakdown */}
				{(summary.averageAccuracy > 0 ||
					summary.averageFluency > 0 ||
					summary.averageProsody > 0 ||
					summary.averageCompleteness > 0) && (
					<div className="mt-6 border-t pt-6">
						<ScoreBreakdown
							accuracy={summary.averageAccuracy}
							fluency={summary.averageFluency}
							completeness={summary.averageCompleteness}
							prosody={summary.averageProsody}
						/>
					</div>
				)}

				<div className="mt-6 grid grid-cols-3 gap-4 border-t pt-6">
					<div className="text-center">
						<p className="font-bold text-2xl text-green-600">
							{summary.bestScore}%
						</p>
						<p className="text-muted-foreground text-sm">Best Score</p>
					</div>
					<div className="text-center">
						<p className="font-bold text-2xl">{summary.totalAttempts}</p>
						<p className="text-muted-foreground text-sm">Total Attempts</p>
					</div>
					<div className="text-center">
						<p className="font-bold text-2xl text-red-500">
							{summary.worstScore}%
						</p>
						<p className="text-muted-foreground text-sm">Lowest Score</p>
					</div>
				</div>
			</div>

			{/* Weak Phonemes */}
			{summary.weakPhonemes && (
				<WeakPhonemesSection phonemes={summary.weakPhonemes} />
			)}

			{/* Per-item breakdown */}
			<div className="rounded-2xl border bg-card p-6">
				<h3 className="mb-4 font-semibold text-lg">Item Breakdown</h3>
				<div className="space-y-3">
					{summary.itemScores.map((itemScore) => {
						const item = items[itemScore.itemIndex];
						const text = item ? item.text : `Item ${itemScore.itemIndex + 1}`;
						const truncated =
							text.length > 60 ? `${text.substring(0, 60)}...` : text;

						return (
							<div
								key={itemScore.itemIndex}
								className="flex items-center justify-between rounded-xl bg-muted/50 p-3"
							>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm">{truncated}</p>
									<p className="text-muted-foreground text-xs">
										{itemScore.attempts} attempt
										{itemScore.attempts !== 1 ? "s" : ""}
									</p>
								</div>
								<div
									className={cn(
										"ml-4 shrink-0 font-bold text-lg",
										itemScore.bestScore >= 80
											? "text-green-500"
											: itemScore.bestScore >= 60
												? "text-yellow-500"
												: "text-red-500",
									)}
								>
									{itemScore.bestScore}%
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{/* Weak words */}
			{summary.weakWords.length > 0 && (
				<div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
					<h3 className="mb-3 font-semibold text-lg text-red-700 dark:text-red-300">
						Words to Practice
					</h3>
					<div className="flex flex-wrap gap-2">
						{summary.weakWords.map((word) => (
							<span
								key={word}
								className="rounded-lg bg-red-100 px-3 py-1.5 font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300"
							>
								{word}
							</span>
						))}
					</div>
				</div>
			)}

			{/* Actions */}
			<div className="flex justify-center gap-4">
				<Button
					variant="outline"
					onClick={() => navigate({ to: "/pronunciation" })}
					className="gap-2"
				>
					<ChevronLeft className="size-4" />
					Back to Modes
				</Button>
				<Button
					onClick={() =>
						navigate({
							to: "/pronunciation",
							search: { mode },
						})
					}
					className="gap-2"
				>
					<RefreshCw className="size-4" />
					Practice Again
				</Button>
			</div>
		</div>
	);
}
