import { env } from "@english.now/env/client";
import { useMutation } from "@tanstack/react-query";
import {
	ArrowRight,
	Loader2,
	Mic,
	MicOff,
	Pause,
	RefreshCw,
	Trophy,
	Volume2,
} from "lucide-react";
import { useState } from "react";
import { OverallScore, ScoreBreakdown } from "@/components/pronunciation/score";
import WordDetailView from "@/components/pronunciation/word-detail-view";
import { Button } from "@/components/ui/button";
import useTextToSpeech from "@/hooks/use-text-to-speech";
import useVoiceRecorder from "@/hooks/use-voice-recorder";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/utils/trpc";

type TongueTwisterItem = {
	text: string;
	speed: "slow" | "medium" | "fast";
	targetPhonemes: string[];
	tip: string;
};

type PhonemeResult = {
	phoneme: string;
	accuracyScore: number;
};

type WordResult = {
	word: string;
	correct: boolean;
	accuracyScore: number;
	errorType: string;
	phonemes: PhonemeResult[];
};

type AssessmentResult = {
	accuracyScore: number;
	fluencyScore: number;
	completenessScore: number;
	prosodyScore: number;
	pronunciationScore: number;
	transcript: string;
	words: WordResult[];
};

type AttemptResult = {
	attemptId: string;
	score: number;
	accuracyScore: number;
	fluencyScore: number;
	completenessScore: number;
	prosodyScore: number;
	words: WordResult[];
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

export default function TongueTwistersMode({
	sessionId,
	items,
	initialIndex,
	onComplete,
}: {
	sessionId: string;
	items: TongueTwisterItem[];
	initialIndex: number;
	onComplete: (summary: SessionSummary) => void;
}) {
	const trpc = useTRPC();
	const [currentIndex, setCurrentIndex] = useState(initialIndex);
	const [attempts, setAttempts] = useState(0);
	const [bestScore, setBestScore] = useState(0);
	const [isAssessing, setIsAssessing] = useState(false);
	const [result, setResult] = useState<AttemptResult | null>(null);
	const [assessmentResult, setAssessmentResult] =
		useState<AssessmentResult | null>(null);

	const { isRecording, startRecording, stopRecording } = useVoiceRecorder();
	const {
		isLoading: isTTSLoading,
		isSpeaking,
		speak,
		stop,
	} = useTextToSpeech();

	const current = items[currentIndex];
	const isLastItem = currentIndex === items.length - 1;

	const submitAttempt = useMutation(
		trpc.pronunciation.submitAttempt.mutationOptions({}),
	);

	const completeSession = useMutation(
		trpc.pronunciation.completeSession.mutationOptions({
			onSuccess: (summary) => {
				onComplete(summary as SessionSummary);
			},
		}),
	);

	async function blobToBase64(blob: Blob): Promise<string> {
		const arrayBuffer = await blob.arrayBuffer();
		const bytes = new Uint8Array(arrayBuffer);
		let binary = "";
		for (let i = 0; i < bytes.length; i++) {
			binary += String.fromCharCode(bytes[i] ?? 0);
		}
		return btoa(binary);
	}

	async function assessPronunciationApi(
		audioBlob: Blob,
		referenceText: string,
	): Promise<AssessmentResult> {
		const audio = await blobToBase64(audioBlob);

		const response = await fetch(
			`${env.VITE_SERVER_URL}/api/pronunciation/assess`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ audio, referenceText }),
			},
		);

		if (!response.ok) {
			const err = await response.json().catch(() => ({}));
			throw new Error(
				(err as { details?: string }).details ||
					"Pronunciation assessment failed",
			);
		}

		return response.json();
	}

	const handleRecord = async () => {
		if (isRecording) {
			const blob = await stopRecording();
			if (!blob || !current) return;

			setIsAssessing(true);
			try {
				const assessment = await assessPronunciationApi(blob, current.text);
				setAssessmentResult(assessment);

				submitAttempt.mutate(
					{
						sessionId,
						itemIndex: currentIndex,
						transcript: assessment.transcript,
						accuracyScore: assessment.accuracyScore,
						fluencyScore: assessment.fluencyScore,
						completenessScore: assessment.completenessScore,
						prosodyScore: assessment.prosodyScore,
						pronunciationScore: assessment.pronunciationScore,
						words: assessment.words.map((w) => ({
							word: w.word,
							accuracyScore: w.accuracyScore,
							errorType: w.errorType,
							phonemes: w.phonemes,
						})),
					},
					{
						onSuccess: (data) => {
							const typedData = data as AttemptResult;
							setResult(typedData);
							setAttempts((prev) => prev + 1);
							if (typedData.score > bestScore) {
								setBestScore(typedData.score);
							}
						},
					},
				);
			} catch (err) {
				console.error("Assessment error:", err);
			} finally {
				setIsAssessing(false);
			}
		} else {
			setResult(null);
			setAssessmentResult(null);
			await startRecording();
		}
	};

	const handleNext = () => {
		if (isLastItem) {
			completeSession.mutate({ sessionId });
		} else {
			setCurrentIndex((prev) => prev + 1);
			setResult(null);
			setAssessmentResult(null);
			setAttempts(0);
			setBestScore(0);
		}
	};

	const handleListen = () => {
		if (!current) return;
		if (isSpeaking) {
			stop();
		} else {
			speak(current.text);
		}
	};

	if (!current) return null;

	return (
		<div className="space-y-6">
			{/* Progress */}
			<div className="flex items-center justify-end">
				<div className="flex items-center gap-4 text-sm">
					<div className="flex gap-1">
						{items.map((item, idx) => (
							<div
								key={item.text}
								className={cn(
									"h-2 w-8 rounded-full transition-colors",
									idx < currentIndex
										? "bg-green-500"
										: idx === currentIndex
											? "bg-primary"
											: "bg-muted",
								)}
							/>
						))}
					</div>
					<span className="text-muted-foreground">Attempts: {attempts}</span>
					<span className="font-medium text-green-600">Best: {bestScore}%</span>
				</div>
			</div>

			{/* Tongue twister card */}
			<div className="relative overflow-hidden rounded-2xl border bg-linear-to-br from-purple-50 to-pink-50 p-8 dark:from-purple-950/30 dark:to-pink-950/30">
				<div className="absolute top-4 right-4 flex items-center gap-2">
					<span
						className={cn(
							"rounded-full px-3 py-1 font-medium text-xs",
							current.speed === "slow" && "bg-green-100 text-green-700",
							current.speed === "medium" && "bg-yellow-100 text-yellow-700",
							current.speed === "fast" && "bg-red-100 text-red-700",
						)}
					>
						{current.speed} pace
					</span>
				</div>
				<div className="mb-3 flex flex-wrap justify-center gap-1">
					{current.targetPhonemes.map((phoneme) => (
						<span
							key={phoneme}
							className="rounded-full bg-purple-100 px-2 py-0.5 font-mono text-purple-700 text-xs dark:bg-purple-900/30 dark:text-purple-300"
						>
							{phoneme}
						</span>
					))}
				</div>
				<div className="flex items-center justify-center pt-2">
					<span className="text-5xl">👅</span>
				</div>
				<p className="mt-4 text-center font-medium text-2xl leading-relaxed">
					{current.text}
				</p>
				<p className="mt-4 text-center text-muted-foreground text-sm italic">
					{current.tip}
				</p>
			</div>

			{/* Controls */}
			<div className="flex flex-col items-center gap-4">
				<Button
					variant="outline"
					size="lg"
					onClick={handleListen}
					disabled={isTTSLoading}
					className="gap-2"
				>
					{isTTSLoading ? (
						<Loader2 className="size-5 animate-spin" />
					) : isSpeaking ? (
						<Pause className="size-5" />
					) : (
						<Volume2 className="size-5" />
					)}
					{isTTSLoading
						? "Loading audio..."
						: isSpeaking
							? "Stop"
							: "Listen first"}
				</Button>

				<Button
					size="lg"
					variant={isRecording ? "destructive" : "default"}
					onClick={handleRecord}
					disabled={isAssessing || submitAttempt.isPending}
					className={cn("gap-2", isRecording && "animate-pulse")}
				>
					{isAssessing || submitAttempt.isPending ? (
						<Loader2 className="size-5 animate-spin" />
					) : isRecording ? (
						<MicOff className="size-5" />
					) : (
						<Mic className="size-5" />
					)}
					{isAssessing
						? "Analyzing..."
						: submitAttempt.isPending
							? "Saving..."
							: isRecording
								? "Stop"
								: "Record"}
				</Button>
			</div>

			{/* Results */}
			{(assessmentResult || result) && (
				<div className="space-y-6 rounded-2xl border bg-card p-6">
					<OverallScore
						score={assessmentResult?.pronunciationScore ?? result?.score ?? 0}
					/>

					<ScoreBreakdown
						accuracy={
							assessmentResult?.accuracyScore ?? result?.accuracyScore ?? 0
						}
						fluency={
							assessmentResult?.fluencyScore ?? result?.fluencyScore ?? 0
						}
						completeness={
							assessmentResult?.completenessScore ??
							result?.completenessScore ??
							0
						}
						prosody={
							assessmentResult?.prosodyScore ?? result?.prosodyScore ?? 0
						}
					/>

					{assessmentResult?.transcript && (
						<div className="rounded-xl bg-muted/50 p-3">
							<p className="text-center text-muted-foreground text-xs">
								What we heard:
							</p>
							<p className="mt-1 text-center">{assessmentResult.transcript}</p>
						</div>
					)}

					<WordDetailView
						words={assessmentResult?.words ?? result?.words ?? []}
					/>

					<div className="flex justify-center gap-4">
						<Button
							variant="outline"
							onClick={() => {
								setResult(null);
								setAssessmentResult(null);
							}}
							className="gap-2"
						>
							<RefreshCw className="size-4" />
							Try Again
						</Button>
						<Button
							onClick={handleNext}
							disabled={completeSession.isPending}
							className="gap-2"
						>
							{completeSession.isPending ? (
								<Loader2 className="size-4 animate-spin" />
							) : isLastItem ? (
								<Trophy className="size-4" />
							) : (
								<ArrowRight className="size-4" />
							)}
							{isLastItem ? "Finish" : "Next Twister"}
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
