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

type ReadAloudItem = {
	text: string;
	topic: string;
	phonemeFocus: string;
	tips: string;
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
export default function ReadAloudMode({
	sessionId,
	items,
	initialIndex,
	onComplete,
}: {
	sessionId: string;
	items: ReadAloudItem[];
	initialIndex: number;
	onComplete: (summary: SessionSummary) => void;
}) {
	const trpc = useTRPC();
	const [currentIndex, setCurrentIndex] = useState(initialIndex);
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

	const currentItem = items[currentIndex];
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
			if (!blob || !currentItem) return;

			setIsAssessing(true);
			try {
				const assessment = await assessPronunciationApi(blob, currentItem.text);
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
							setResult(data as AttemptResult);
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
		}
	};

	const handleListen = () => {
		if (!currentItem) return;
		if (isSpeaking) {
			stop();
		} else {
			speak(currentItem.text);
		}
	};

	if (!currentItem) return null;

	return (
		<div className="space-y-6">
			{/* Progress */}
			<div className="flex items-center justify-end">
				<div className="flex items-center gap-3">
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
					<span className="text-muted-foreground text-sm">
						{currentIndex + 1} / {items.length}
					</span>
				</div>
			</div>

			{/* Text to read */}
			<div className="rounded-2xl border p-8">
				<div className="mb-2 text-center">
					<span className="rounded-full bg-lime-100 px-3 py-1 text-lime-700 text-xs dark:bg-blue-900/30 dark:text-blue-300">
						{currentItem.topic} - {currentItem.phonemeFocus}
					</span>
				</div>
				<p className="text-center font-medium text-2xl leading-relaxed">
					{currentItem.text}
				</p>
				<p className="mt-4 text-center text-muted-foreground text-sm italic">
					{currentItem.tips}
				</p>

				<div className="flex justify-center">
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
								: "Listen to pronunciation"}
					</Button>
				</div>

				<div className="flex justify-center">
					<Button
						size="lg"
						variant={isRecording ? "destructive" : "default"}
						onClick={handleRecord}
						disabled={isAssessing || submitAttempt.isPending}
						className={cn(
							"gap-2 transition-all",
							isRecording && "animate-pulse",
						)}
					>
						{isAssessing || submitAttempt.isPending ? (
							<Loader2 className="size-5 animate-spin" />
						) : isRecording ? (
							<MicOff className="size-5" />
						) : (
							<Mic className="size-5" />
						)}
						{isAssessing
							? "Analyzing pronunciation..."
							: submitAttempt.isPending
								? "Saving..."
								: isRecording
									? "Stop Recording"
									: "Start Recording"}
					</Button>
				</div>
			</div>

			{/* Recording area */}
			<div className="space-y-4">
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
								<p className="mt-1 text-center">
									{assessmentResult.transcript}
								</p>
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
								{isLastItem ? "Finish" : "Next"}
							</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
