// import { createFileRoute } from "@tanstack/react-router";

// export const Route = createFileRoute("/_dashboard/pronunciation_b")({
// 	component: RouteComponent,
// });

// function RouteComponent() {
// 	return <div>Hello "/_dashboard/pronunciation_b"!</div>;
// }

// import { env } from "@english.now/env/client";
// import { useMutation, useQuery } from "@tanstack/react-query";
// import { createFileRoute, useNavigate } from "@tanstack/react-router";
// import {
// 	ArrowRight,
// 	Calendar,
// 	Check,
// 	Clock,
// 	Loader2,
// 	Mic,
// 	MicOff,
// 	Pause,
// 	Play,
// 	RefreshCw,
// 	Volume2,
// 	X,
// } from "lucide-react";
// import { useCallback, useEffect, useRef, useState } from "react";
// import { Button } from "@/components/ui/button";
// import { cn } from "@/lib/utils";
// import { useTRPC } from "@/utils/trpc";

// // ============================================
// // ROUTE
// // ============================================

// type PronunciationSearch = {
// 	mode?: string;
// };

// export const Route = createFileRoute("/_dashboard/pronunciation")({
// 	validateSearch: (search: Record<string, unknown>): PronunciationSearch => ({
// 		mode: typeof search.mode === "string" ? search.mode : undefined,
// 	}),
// 	component: PronunciationPage,
// });

// // ============================================
// // TYPES
// // ============================================

// type PracticeMode =
// 	| "read-aloud"
// 	| "tongue-twisters"
// 	| "minimal-pairs"
// 	| "shadowing";

// type SessionSummary = {
// 	averageScore: number;
// 	totalAttempts: number;
// 	bestScore: number;
// 	worstScore: number;
// 	weakWords: string[];
// 	itemScores: { itemIndex: number; bestScore: number; attempts: number }[];
// };

// // ============================================
// // DATA
// // ============================================

// const MODES = [
// 	{
// 		id: "read-aloud" as const,
// 		name: "Read Aloud",
// 		icon: "📖",
// 		description: "Read text and get instant feedback",
// 		color: "from-blue-500 to-cyan-500",
// 	},
// 	{
// 		id: "tongue-twisters" as const,
// 		name: "Tongue Twisters",
// 		icon: "👅",
// 		description: "Challenge yourself with tricky phrases",
// 		color: "from-purple-500 to-pink-500",
// 	},
// 	{
// 		id: "minimal-pairs" as const,
// 		name: "Minimal Pairs",
// 		icon: "👂",
// 		description: "Master similar sounding words",
// 		color: "from-orange-500 to-red-500",
// 	},
// 	{
// 		id: "shadowing" as const,
// 		name: "Shadowing",
// 		icon: "🎧",
// 		description: "Listen and repeat immediately",
// 		color: "from-green-500 to-emerald-500",
// 	},
// ];

// const MINIMAL_PAIRS = [
// 	{ word1: "ship", word2: "sheep", phoneme: "/ɪ/ vs /iː/", category: "vowels" },
// 	{ word1: "bed", word2: "bad", phoneme: "/e/ vs /æ/", category: "vowels" },
// 	{ word1: "full", word2: "fool", phoneme: "/ʊ/ vs /uː/", category: "vowels" },
// 	{ word1: "cat", word2: "cut", phoneme: "/æ/ vs /ʌ/", category: "vowels" },
// 	{
// 		word1: "think",
// 		word2: "sink",
// 		phoneme: "/θ/ vs /s/",
// 		category: "consonants",
// 	},
// 	{
// 		word1: "three",
// 		word2: "tree",
// 		phoneme: "/θ/ vs /t/",
// 		category: "consonants",
// 	},
// 	{ word1: "van", word2: "fan", phoneme: "/v/ vs /f/", category: "consonants" },
// 	{
// 		word1: "light",
// 		word2: "right",
// 		phoneme: "/l/ vs /r/",
// 		category: "consonants",
// 	},
// 	{
// 		word1: "very",
// 		word2: "berry",
// 		phoneme: "/v/ vs /b/",
// 		category: "consonants",
// 	},
// 	{ word1: "wet", word2: "vet", phoneme: "/w/ vs /v/", category: "consonants" },
// ];

// const SHADOWING_TEXTS: Record<
// 	"beginner" | "intermediate" | "advanced",
// 	string[]
// > = {
// 	beginner: [
// 		"Nice to meet you.",
// 		"Where are you from?",
// 		"I don't understand.",
// 		"Can you say that again?",
// 		"That sounds great!",
// 	],
// 	intermediate: [
// 		"I've been meaning to ask you something.",
// 		"What do you think about that idea?",
// 		"Let me know if you need any help.",
// 		"I completely agree with you on that.",
// 		"That's an interesting point of view.",
// 	],
// 	advanced: [
// 		"I couldn't have put it better myself.",
// 		"That's easier said than done, isn't it?",
// 		"I was under the impression that we had agreed on this.",
// 		"For what it's worth, I think you made the right decision.",
// 		"Let's not beat around the bush here.",
// 	],
// };

// // ============================================
// // HOOKS
// // ============================================

// function useVoiceRecorder() {
// 	const [isRecording, setIsRecording] = useState(false);
// 	const [isTranscribing, setIsTranscribing] = useState(false);
// 	const [transcript, setTranscript] = useState("");
// 	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
// 	const audioChunksRef = useRef<Blob[]>([]);
// 	const streamRef = useRef<MediaStream | null>(null);

// 	const stopMediaStream = useCallback(() => {
// 		if (streamRef.current) {
// 			for (const track of streamRef.current.getTracks()) {
// 				track.stop();
// 			}
// 			streamRef.current = null;
// 		}
// 	}, []);

// 	const transcribeAudio = useCallback(async (blob: Blob): Promise<string> => {
// 		const arrayBuffer = await blob.arrayBuffer();
// 		const bytes = new Uint8Array(arrayBuffer);
// 		let binary = "";
// 		for (let i = 0; i < bytes.length; i++) {
// 			binary += String.fromCharCode(bytes[i] ?? 0);
// 		}
// 		const base64 = btoa(binary);

// 		const response = await fetch(
// 			`${env.VITE_SERVER_URL}/api/conversation/transcribe`,
// 			{
// 				method: "POST",
// 				headers: { "Content-Type": "application/json" },
// 				credentials: "include",
// 				body: JSON.stringify({ audio: base64 }),
// 			},
// 		);

// 		if (!response.ok) throw new Error("Transcription failed");

// 		const data = await response.json();
// 		return data.transcript || "";
// 	}, []);

// 	const startRecording = useCallback(async () => {
// 		try {
// 			const stream = await navigator.mediaDevices.getUserMedia({
// 				audio: true,
// 			});
// 			streamRef.current = stream;

// 			const mediaRecorder = new MediaRecorder(stream, {
// 				mimeType: "audio/webm;codecs=opus",
// 			});
// 			mediaRecorderRef.current = mediaRecorder;
// 			audioChunksRef.current = [];

// 			mediaRecorder.ondataavailable = (event) => {
// 				if (event.data.size > 0) {
// 					audioChunksRef.current.push(event.data);
// 				}
// 			};

// 			mediaRecorder.start();
// 			setIsRecording(true);
// 			setTranscript("");
// 		} catch (err) {
// 			console.error("Error accessing microphone:", err);
// 		}
// 	}, []);

// 	const stopRecording = useCallback(async () => {
// 		if (!mediaRecorderRef.current || !isRecording) return;

// 		return new Promise<string>((resolve) => {
// 			const recorder = mediaRecorderRef.current;
// 			if (!recorder) {
// 				resolve("");
// 				return;
// 			}

// 			recorder.onstop = async () => {
// 				stopMediaStream();
// 				const blob = new Blob(audioChunksRef.current, {
// 					type: "audio/webm",
// 				});

// 				setIsRecording(false);
// 				setIsTranscribing(true);

// 				try {
// 					const text = await transcribeAudio(blob);
// 					setTranscript(text);
// 					resolve(text);
// 				} catch (err) {
// 					console.error("Transcription error:", err);
// 					resolve("");
// 				} finally {
// 					setIsTranscribing(false);
// 				}
// 			};

// 			recorder.stop();
// 		});
// 	}, [isRecording, stopMediaStream, transcribeAudio]);

// 	const resetTranscript = useCallback(() => {
// 		setTranscript("");
// 	}, []);

// 	useEffect(() => {
// 		return () => {
// 			if (
// 				mediaRecorderRef.current &&
// 				mediaRecorderRef.current.state !== "inactive"
// 			) {
// 				try {
// 					mediaRecorderRef.current.stop();
// 				} catch (_) {
// 					// ignore
// 				}
// 			}
// 			if (streamRef.current) {
// 				for (const track of streamRef.current.getTracks()) {
// 					track.stop();
// 				}
// 			}
// 		};
// 	}, []);

// 	return {
// 		isRecording,
// 		isTranscribing,
// 		transcript,
// 		startRecording,
// 		stopRecording,
// 		resetTranscript,
// 	};
// }

// function useSpeechSynthesis() {
// 	const [isSpeaking, setIsSpeaking] = useState(false);

// 	const speak = useCallback((text: string, rate = 1) => {
// 		if (!window.speechSynthesis) return;

// 		window.speechSynthesis.cancel();
// 		const utterance = new SpeechSynthesisUtterance(text);
// 		utterance.lang = "en-US";
// 		utterance.rate = rate;

// 		utterance.onstart = () => setIsSpeaking(true);
// 		utterance.onend = () => setIsSpeaking(false);
// 		utterance.onerror = () => setIsSpeaking(false);

// 		window.speechSynthesis.speak(utterance);
// 	}, []);

// 	const stop = useCallback(() => {
// 		window.speechSynthesis?.cancel();
// 		setIsSpeaking(false);
// 	}, []);

// 	return { isSpeaking, speak, stop };
// }

// // ============================================
// // CLIENT-SIDE TEXT COMPARISON (for hardcoded modes)
// // ============================================

// function compareTexts(
// 	expected: string,
// 	actual: string,
// ): { score: number; words: { word: string; correct: boolean }[] } {
// 	const expectedWords = expected
// 		.toLowerCase()
// 		.replace(/[^\w\s]/g, "")
// 		.split(/\s+/);
// 	const actualWords = actual
// 		.toLowerCase()
// 		.replace(/[^\w\s]/g, "")
// 		.split(/\s+/);

// 	const words: { word: string; correct: boolean }[] = [];
// 	let correct = 0;

// 	for (let i = 0; i < expectedWords.length; i++) {
// 		const exp = expectedWords[i] || "";
// 		const act = actualWords[i] || "";
// 		const isCorrect = exp === act || levenshteinDistance(exp, act) <= 1;
// 		words.push({ word: exp, correct: isCorrect });
// 		if (isCorrect) correct++;
// 	}

// 	const score =
// 		expectedWords.length > 0
// 			? Math.round((correct / expectedWords.length) * 100)
// 			: 0;
// 	return { score, words };
// }

// function levenshteinDistance(a: string, b: string): number {
// 	const matrix: number[][] = Array.from({ length: b.length + 1 }, () =>
// 		Array.from({ length: a.length + 1 }, () => 0),
// 	);
// 	for (let i = 0; i <= b.length; i++) {
// 		const row = matrix[i];
// 		if (row) row[0] = i;
// 	}
// 	for (let j = 0; j <= a.length; j++) {
// 		const row = matrix[0];
// 		if (row) row[j] = j;
// 	}
// 	for (let i = 1; i <= b.length; i++) {
// 		for (let j = 1; j <= a.length; j++) {
// 			const prevRow = matrix[i - 1];
// 			const currRow = matrix[i];
// 			if (!prevRow || !currRow) continue;
// 			if (b.charAt(i - 1) === a.charAt(j - 1)) {
// 				currRow[j] = prevRow[j - 1] ?? 0;
// 			} else {
// 				currRow[j] = Math.min(
// 					(prevRow[j - 1] ?? 0) + 1,
// 					(currRow[j - 1] ?? 0) + 1,
// 					(prevRow[j] ?? 0) + 1,
// 				);
// 			}
// 		}
// 	}
// 	return matrix[b.length]?.[a.length] ?? 0;
// }

// // ============================================
// // SHARED UI COMPONENTS
// // ============================================

// function ScoreDisplay({ score }: { score: number }) {
// 	const getColor = () => {
// 		if (score >= 80) return "text-green-500";
// 		if (score >= 60) return "text-yellow-500";
// 		return "text-red-500";
// 	};

// 	const getMessage = () => {
// 		if (score >= 90) return "Excellent!";
// 		if (score >= 80) return "Great job!";
// 		if (score >= 60) return "Good effort!";
// 		return "Keep practicing!";
// 	};

// 	return (
// 		<div className="text-center">
// 			<div className={cn("font-bold text-6xl", getColor())}>{score}%</div>
// 			<p className="mt-2 text-lg text-muted-foreground">{getMessage()}</p>
// 		</div>
// 	);
// }

// function WordHighlight({
// 	words,
// }: {
// 	words: { word: string; correct: boolean }[];
// }) {
// 	return (
// 		<div className="flex flex-wrap gap-2">
// 			{words.map((item, idx) => (
// 				<span
// 					key={`${item.word}-${idx}`}
// 					className={cn(
// 						"rounded-lg px-3 py-1.5 font-medium text-lg",
// 						item.correct
// 							? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
// 							: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
// 					)}
// 				>
// 					{item.word}
// 					{item.correct ? (
// 						<Check className="ml-1 inline size-4" />
// 					) : (
// 						<X className="ml-1 inline size-4" />
// 					)}
// 				</span>
// 			))}
// 		</div>
// 	);
// }

// function ModeSelector({
// 	selectedMode,
// 	onSelect,
// }: {
// 	selectedMode: PracticeMode | null;
// 	onSelect: (mode: PracticeMode) => void;
// }) {
// 	return (
// 		<div className="grid gap-4 sm:grid-cols-2">
// 			{MODES.map((mode) => (
// 				<button
// 					key={mode.id}
// 					type="button"
// 					onClick={() => onSelect(mode.id)}
// 					className={cn(
// 						"group relative overflow-hidden rounded-2xl border-2 p-6 text-left transition-all hover:scale-[1.02] hover:shadow-lg",
// 						selectedMode === mode.id
// 							? "border-primary bg-primary/5 shadow-md"
// 							: "border-transparent bg-muted/40 hover:border-primary/30",
// 					)}
// 				>
// 					<div
// 						className={cn(
// 							"absolute inset-0 bg-linear-to-br opacity-0 transition-opacity group-hover:opacity-10",
// 							mode.color,
// 						)}
// 					/>
// 					<div className="relative">
// 						<span className="text-4xl">{mode.icon}</span>
// 						<h3 className="mt-3 font-semibold text-lg">{mode.name}</h3>
// 						<p className="mt-1 text-muted-foreground text-sm">
// 							{mode.description}
// 						</p>
// 					</div>
// 					{selectedMode === mode.id && (
// 						<div className="absolute top-4 right-4">
// 							<div className="flex size-6 items-center justify-center rounded-full bg-primary">
// 								<Check className="size-4 text-primary-foreground" />
// 							</div>
// 						</div>
// 					)}
// 				</button>
// 			))}
// 		</div>
// 	);
// }

// // ============================================
// // HARDCODED MODES (Minimal Pairs + Shadowing)
// // ============================================

// function MinimalPairsMode() {
// 	const [currentIndex, setCurrentIndex] = useState(0);
// 	const [selectedWord, setSelectedWord] = useState<1 | 2 | null>(null);
// 	const [showAnswer, setShowAnswer] = useState(false);
// 	const [score, setScore] = useState({ correct: 0, total: 0 });
// 	const [mode, setMode] = useState<"listen" | "speak">("listen");

// 	const {
// 		isRecording,
// 		isTranscribing,
// 		transcript,
// 		startRecording,
// 		stopRecording,
// 		resetTranscript,
// 	} = useVoiceRecorder();
// 	const { isSpeaking, speak, stop } = useSpeechSynthesis();

// 	const pair = MINIMAL_PAIRS[currentIndex] ??
// 		MINIMAL_PAIRS[0] ?? { word1: "", word2: "", phoneme: "", category: "" };
// 	const [targetWord, setTargetWord] = useState<1 | 2>(1);

// 	const playWord = (word: string) => {
// 		if (isSpeaking) {
// 			stop();
// 		} else {
// 			speak(word, 0.8);
// 		}
// 	};

// 	const playRandomWord = () => {
// 		const random = Math.random() > 0.5 ? 1 : 2;
// 		setTargetWord(random as 1 | 2);
// 		setSelectedWord(null);
// 		setShowAnswer(false);
// 		const word = random === 1 ? pair.word1 : pair.word2;
// 		setTimeout(() => speak(word, 0.8), 300);
// 	};

// 	const handleSelect = (choice: 1 | 2) => {
// 		setSelectedWord(choice);
// 		setShowAnswer(true);
// 		const isCorrect = choice === targetWord;
// 		setScore((prev) => ({
// 			correct: prev.correct + (isCorrect ? 1 : 0),
// 			total: prev.total + 1,
// 		}));
// 	};

// 	const handleSpeakCheck = () => {
// 		if (transcript) {
// 			const lower = transcript.toLowerCase().trim();
// 			const word1Match = lower.includes(pair.word1.toLowerCase());
// 			const word2Match = lower.includes(pair.word2.toLowerCase());

// 			if (word1Match || word2Match) {
// 				setShowAnswer(true);
// 				if (
// 					(targetWord === 1 && word1Match) ||
// 					(targetWord === 2 && word2Match)
// 				) {
// 					setScore((prev) => ({
// 						correct: prev.correct + 1,
// 						total: prev.total + 1,
// 					}));
// 					setSelectedWord(targetWord);
// 				} else {
// 					setScore((prev) => ({ ...prev, total: prev.total + 1 }));
// 					setSelectedWord(targetWord === 1 ? 2 : 1);
// 				}
// 			}
// 		}
// 	};

// 	const handleNext = () => {
// 		setCurrentIndex((prev) => (prev + 1) % MINIMAL_PAIRS.length);
// 		setSelectedWord(null);
// 		setShowAnswer(false);
// 		resetTranscript();
// 	};

// 	return (
// 		<div className="space-y-6">
// 			<div className="flex items-center justify-between">
// 				<div className="flex gap-2 rounded-full bg-muted p-1">
// 					<button
// 						type="button"
// 						onClick={() => {
// 							setMode("listen");
// 							setShowAnswer(false);
// 							setSelectedWord(null);
// 							resetTranscript();
// 						}}
// 						className={cn(
// 							"rounded-full px-4 py-2 font-medium text-sm transition-all",
// 							mode === "listen" ? "bg-background shadow" : "",
// 						)}
// 					>
// 						Listen & Choose
// 					</button>
// 					<button
// 						type="button"
// 						onClick={() => {
// 							setMode("speak");
// 							setShowAnswer(false);
// 							setSelectedWord(null);
// 							resetTranscript();
// 						}}
// 						className={cn(
// 							"rounded-full px-4 py-2 font-medium text-sm transition-all",
// 							mode === "speak" ? "bg-background shadow" : "",
// 						)}
// 					>
// 						Speak the Word
// 					</button>
// 				</div>
// 				<div className="font-medium text-sm">
// 					Score: <span className="text-green-600">{score.correct}</span>/
// 					{score.total}
// 				</div>
// 			</div>

// 			<div className="rounded-2xl border bg-linear-to-br from-orange-50 to-red-50 p-8 dark:from-orange-950/30 dark:to-red-950/30">
// 				<div className="mb-4 text-center">
// 					<span className="rounded-full bg-orange-100 px-3 py-1 font-mono text-orange-700 text-sm dark:bg-orange-900/30 dark:text-orange-300">
// 						{pair.phoneme}
// 					</span>
// 					<span className="ml-2 text-muted-foreground text-sm capitalize">
// 						{pair.category}
// 					</span>
// 				</div>

// 				<div className="flex items-center justify-center gap-8">
// 					<button
// 						type="button"
// 						onClick={() =>
// 							mode === "listen" && !showAnswer
// 								? handleSelect(1)
// 								: playWord(pair.word1)
// 						}
// 						disabled={mode === "listen" && showAnswer}
// 						className={cn(
// 							"group relative rounded-2xl border-4 px-8 py-6 text-center transition-all",
// 							mode === "listen" &&
// 								!showAnswer &&
// 								"cursor-pointer hover:scale-105 hover:border-orange-400",
// 							showAnswer &&
// 								selectedWord === 1 &&
// 								targetWord === 1 &&
// 								"border-green-500 bg-green-50",
// 							showAnswer &&
// 								selectedWord === 1 &&
// 								targetWord !== 1 &&
// 								"border-red-500 bg-red-50",
// 							showAnswer &&
// 								targetWord === 1 &&
// 								selectedWord !== 1 &&
// 								"border-green-500/50",
// 							!showAnswer && "border-muted bg-background",
// 						)}
// 					>
// 						<Volume2 className="mx-auto mb-2 size-6 text-muted-foreground" />
// 						<span className="block font-bold text-3xl">{pair.word1}</span>
// 					</button>

// 					<span className="font-bold text-2xl text-muted-foreground">vs</span>

// 					<button
// 						type="button"
// 						onClick={() =>
// 							mode === "listen" && !showAnswer
// 								? handleSelect(2)
// 								: playWord(pair.word2)
// 						}
// 						disabled={mode === "listen" && showAnswer}
// 						className={cn(
// 							"group relative rounded-2xl border-4 px-8 py-6 text-center transition-all",
// 							mode === "listen" &&
// 								!showAnswer &&
// 								"cursor-pointer hover:scale-105 hover:border-orange-400",
// 							showAnswer &&
// 								selectedWord === 2 &&
// 								targetWord === 2 &&
// 								"border-green-500 bg-green-50",
// 							showAnswer &&
// 								selectedWord === 2 &&
// 								targetWord !== 2 &&
// 								"border-red-500 bg-red-50",
// 							showAnswer &&
// 								targetWord === 2 &&
// 								selectedWord !== 2 &&
// 								"border-green-500/50",
// 							!showAnswer && "border-muted bg-background",
// 						)}
// 					>
// 						<Volume2 className="mx-auto mb-2 size-6 text-muted-foreground" />
// 						<span className="block font-bold text-3xl">{pair.word2}</span>
// 					</button>
// 				</div>
// 			</div>

// 			<div className="flex flex-col items-center gap-4">
// 				{mode === "listen" &&
// 					(!showAnswer ? (
// 						<Button size="lg" onClick={playRandomWord} className="gap-2">
// 							<Play className="size-5" />
// 							Play Word
// 						</Button>
// 					) : (
// 						<div className="space-y-4 text-center">
// 							<p
// 								className={cn(
// 									"font-medium text-lg",
// 									selectedWord === targetWord
// 										? "text-green-600"
// 										: "text-red-600",
// 								)}
// 							>
// 								{selectedWord === targetWord
// 									? "Correct!"
// 									: `It was "${targetWord === 1 ? pair.word1 : pair.word2}"`}
// 							</p>
// 							<Button onClick={handleNext} className="gap-2">
// 								Next Pair
// 								<ArrowRight className="size-4" />
// 							</Button>
// 						</div>
// 					))}

// 				{mode === "speak" && (
// 					<>
// 						<p className="text-center text-muted-foreground">
// 							{showAnswer
// 								? `The target was: "${targetWord === 1 ? pair.word1 : pair.word2}"`
// 								: "Press play, then say the word you hear"}
// 						</p>

// 						{!showAnswer && (
// 							<div className="flex gap-4">
// 								<Button
// 									size="lg"
// 									variant="outline"
// 									onClick={playRandomWord}
// 									className="gap-2"
// 								>
// 									<Play className="size-5" />
// 									Play Word
// 								</Button>
// 								<Button
// 									size="lg"
// 									variant={isRecording ? "destructive" : "default"}
// 									onClick={isRecording ? stopRecording : startRecording}
// 									disabled={isTranscribing}
// 									className={cn("gap-2", isRecording && "animate-pulse")}
// 								>
// 									{isTranscribing ? (
// 										<Loader2 className="size-5 animate-spin" />
// 									) : isRecording ? (
// 										<MicOff className="size-5" />
// 									) : (
// 										<Mic className="size-5" />
// 									)}
// 									{isTranscribing ? "..." : isRecording ? "Stop" : "Record"}
// 								</Button>
// 							</div>
// 						)}

// 						{transcript && !showAnswer && (
// 							<div className="space-y-2 text-center">
// 								<p className="text-muted-foreground text-sm">
// 									You said: &quot;{transcript}&quot;
// 								</p>
// 								<Button onClick={handleSpeakCheck}>Check Answer</Button>
// 							</div>
// 						)}

// 						{showAnswer && (
// 							<Button onClick={handleNext} className="gap-2">
// 								Next Pair
// 								<ArrowRight className="size-4" />
// 							</Button>
// 						)}
// 					</>
// 				)}
// 			</div>

// 			<p className="text-center text-muted-foreground text-sm">
// 				{currentIndex + 1} of {MINIMAL_PAIRS.length} pairs
// 			</p>
// 		</div>
// 	);
// }

// function mapLevelToDifficulty(
// 	level: string | null | undefined,
// ): "beginner" | "intermediate" | "advanced" {
// 	switch (level) {
// 		case "beginner":
// 		case "elementary":
// 			return "beginner";
// 		case "upper-intermediate":
// 		case "advanced":
// 			return "advanced";
// 		default:
// 			return "intermediate";
// 	}
// }

// function ShadowingMode() {
// 	const trpc = useTRPC();
// 	const { data: profile } = useQuery(trpc.profile.get.queryOptions());
// 	const difficulty = mapLevelToDifficulty(profile?.level);
// 	const [currentIndex, setCurrentIndex] = useState(0);
// 	const [phase, setPhase] = useState<"listen" | "record" | "compare">("listen");
// 	const [result, setResult] = useState<{
// 		score: number;
// 		words: { word: string; correct: boolean }[];
// 	} | null>(null);

// 	const {
// 		isRecording,
// 		isTranscribing,
// 		transcript,
// 		startRecording,
// 		stopRecording,
// 		resetTranscript,
// 	} = useVoiceRecorder();
// 	const { isSpeaking, speak, stop } = useSpeechSynthesis();

// 	const texts = SHADOWING_TEXTS[difficulty];
// 	const currentText = texts[currentIndex] ?? texts[0] ?? "";

// 	const handleListen = () => {
// 		if (isSpeaking) {
// 			stop();
// 		} else {
// 			speak(currentText, 0.85);
// 			setPhase("listen");
// 		}
// 	};

// 	const handleRecord = async () => {
// 		if (isRecording) {
// 			const text = await stopRecording();
// 			if (text) {
// 				const comparison = compareTexts(currentText, text);
// 				setResult(comparison);
// 				setPhase("compare");
// 			}
// 		} else {
// 			resetTranscript();
// 			setResult(null);
// 			await startRecording();
// 			setPhase("record");
// 		}
// 	};

// 	const handleNext = () => {
// 		setCurrentIndex((prev) => (prev + 1) % texts.length);
// 		resetTranscript();
// 		setResult(null);
// 		setPhase("listen");
// 	};

// 	const handleReset = () => {
// 		resetTranscript();
// 		setResult(null);
// 		setPhase("listen");
// 	};

// 	return (
// 		<div className="space-y-6">
// 			<div className="flex items-center justify-end">
// 				<span className="text-muted-foreground text-sm">
// 					{currentIndex + 1} / {texts.length}
// 				</span>
// 			</div>

// 			<div className="rounded-2xl border bg-linear-to-br from-green-50 to-emerald-50 p-8 dark:from-green-950/30 dark:to-emerald-950/30">
// 				<div className="mb-6 flex items-center justify-center gap-2">
// 					{(["listen", "record", "compare"] as const).map((p, idx) => (
// 						<>
// 							{idx > 0 && <div className="h-1 w-8 rounded-full bg-muted" />}
// 							<div
// 								key={p}
// 								className={cn(
// 									"flex size-8 items-center justify-center rounded-full font-bold text-sm",
// 									phase === p
// 										? "bg-green-500 text-white"
// 										: "bg-muted text-muted-foreground",
// 								)}
// 							>
// 								{idx + 1}
// 							</div>
// 						</>
// 					))}
// 				</div>

// 				<div className="mb-4 text-center">
// 					<span className="rounded-full bg-green-100 px-3 py-1 font-medium text-green-700 text-sm dark:bg-green-900/30 dark:text-green-300">
// 						{phase === "listen" && "Listen"}
// 						{phase === "record" && "Repeat"}
// 						{phase === "compare" && "Results"}
// 					</span>
// 				</div>

// 				<p className="text-center font-medium text-2xl leading-relaxed">
// 					{currentText}
// 				</p>
// 			</div>

// 			<div className="flex flex-col items-center gap-4">
// 				<div className="flex gap-4">
// 					<Button
// 						size="lg"
// 						variant={isSpeaking ? "secondary" : "outline"}
// 						onClick={handleListen}
// 						className="gap-2"
// 					>
// 						{isSpeaking ? (
// 							<Pause className="size-5" />
// 						) : (
// 							<Volume2 className="size-5" />
// 						)}
// 						{isSpeaking ? "Playing..." : "Listen"}
// 					</Button>

// 					<Button
// 						size="lg"
// 						variant={isRecording ? "destructive" : "default"}
// 						onClick={handleRecord}
// 						disabled={isTranscribing}
// 						className={cn("gap-2", isRecording && "animate-pulse")}
// 					>
// 						{isTranscribing ? (
// 							<Loader2 className="size-5 animate-spin" />
// 						) : isRecording ? (
// 							<MicOff className="size-5" />
// 						) : (
// 							<Mic className="size-5" />
// 						)}
// 						{isTranscribing
// 							? "Transcribing..."
// 							: isRecording
// 								? "Stop & Check"
// 								: "Record"}
// 					</Button>
// 				</div>

// 				{isRecording && (
// 					<div className="w-full rounded-xl border bg-muted/50 p-4">
// 						<p className="text-center text-muted-foreground text-sm">
// 							Recording... Click &quot;Stop &amp; Check&quot; when done.
// 						</p>
// 					</div>
// 				)}
// 			</div>

// 			{result && (
// 				<div className="space-y-6 rounded-2xl border bg-card p-6">
// 					<ScoreDisplay score={result.score} />

// 					<div className="grid gap-4 sm:grid-cols-2">
// 						<div className="rounded-xl bg-muted/50 p-4">
// 							<p className="mb-2 font-medium text-muted-foreground text-sm">
// 								Original:
// 							</p>
// 							<p>{currentText}</p>
// 						</div>
// 						<div className="rounded-xl bg-muted/50 p-4">
// 							<p className="mb-2 font-medium text-muted-foreground text-sm">
// 								Your version:
// 							</p>
// 							<p>{transcript}</p>
// 						</div>
// 					</div>

// 					<WordHighlight words={result.words} />

// 					<div className="flex justify-center gap-4">
// 						<Button variant="outline" onClick={handleReset} className="gap-2">
// 							<RefreshCw className="size-4" />
// 							Try Again
// 						</Button>
// 						<Button onClick={handleNext} className="gap-2">
// 							Next Phrase
// 							<ArrowRight className="size-4" />
// 						</Button>
// 					</div>
// 				</div>
// 			)}
// 		</div>
// 	);
// }

// // ============================================
// // MAIN PAGE
// // ============================================

// type PageView =
// 	| { type: "select" }
// 	| { type: "starting"; mode: "read-aloud" | "tongue-twisters" }
// 	| { type: "practice"; mode: "minimal-pairs" | "shadowing" };

// function PronunciationPage() {
// 	const { mode: searchMode } = Route.useSearch();
// 	const trpc = useTRPC();
// 	const navigate = useNavigate();

// 	const startSession = useMutation(
// 		trpc.pronunciation.startSession.mutationOptions({
// 			onSuccess: (data) => {
// 				navigate({
// 					to: "/pronunciation/$sessionId",
// 					params: { sessionId: data.sessionId },
// 				});
// 			},
// 		}),
// 	);

// 	const [view, setView] = useState<PageView>(() => {
// 		if (searchMode === "minimal-pairs" || searchMode === "shadowing") {
// 			return { type: "practice", mode: searchMode };
// 		}
// 		return { type: "select" };
// 	});

// 	useEffect(() => {
// 		if (
// 			(searchMode === "read-aloud" || searchMode === "tongue-twisters") &&
// 			!startSession.isPending &&
// 			!startSession.isSuccess
// 		) {
// 			setView({ type: "starting", mode: searchMode });
// 			startSession.mutate({ mode: searchMode });
// 		}
// 	}, [searchMode]);

// 	const handleModeSelect = (mode: PracticeMode) => {
// 		if (mode === "read-aloud" || mode === "tongue-twisters") {
// 			setView({ type: "starting", mode });
// 			startSession.mutate({ mode });
// 		} else {
// 			setView({ type: "practice", mode });
// 		}
// 	};

// 	const handleBackToModes = () => {
// 		setView({ type: "select" });
// 	};

// 	return (
// 		<div className="min-h-screen pb-12">
// 			<div className="container relative z-10 mx-auto max-w-5xl px-4 py-6 pt-8">
// 				{/* Header */}
// 				{(view.type === "select" || view.type === "practice") && (
// 					<div className="mb-8">
// 						{view.type === "practice" && (
// 							<button
// 								type="button"
// 								onClick={handleBackToModes}
// 								className="mb-4 flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
// 							>
// 								<ArrowRight className="size-4 rotate-180" />
// 								Back to modes
// 							</button>
// 						)}
// 						<h1 className="font-bold font-lyon text-4xl tracking-tight">
// 							{view.type === "practice"
// 								? MODES.find((m) => m.id === view.mode)?.name
// 								: "Pronunciation Practice"}
// 						</h1>
// 						<p className="mt-2 text-lg text-muted-foreground">
// 							{view.type === "practice"
// 								? MODES.find((m) => m.id === view.mode)?.description
// 								: "Choose a practice mode to improve your English pronunciation"}
// 						</p>
// 					</div>
// 				)}

// 				{/* Content */}
// 				{view.type === "select" && (
// 					<ModeSelector selectedMode={null} onSelect={handleModeSelect} />
// 				)}

// 				{view.type === "starting" && (
// 					<div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
// 						<Loader2 className="size-8 animate-spin text-primary" />
// 						<p className="text-lg text-muted-foreground">
// 							Generating content...
// 						</p>
// 					</div>
// 				)}

// 				{view.type === "practice" && (
// 					<div className="fade-in slide-in-from-bottom-4 animate-in duration-300">
// 						{view.mode === "minimal-pairs" && <MinimalPairsMode />}
// 						{view.mode === "shadowing" && <ShadowingMode />}
// 					</div>
// 				)}
// 			</div>
// 		</div>
// 	);
// }
