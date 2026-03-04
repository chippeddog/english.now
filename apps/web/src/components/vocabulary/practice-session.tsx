import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, RotateCcw, Volume2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePracticeTimer } from "@/hooks/use-practice-timer";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/utils/trpc";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";

export type FlashcardItem = {
	id: string;
	type: "word" | "phrase";
	prompt: string;
	answer: string;
	ipa: string | null;
	audioUrl: string | null;
	detail: string | null;
	level: string | null;
	currentMastery: string;
};

function advanceMastery(m: string): "learning" | "reviewing" | "mastered" {
	if (m === "new") return "learning";
	if (m === "learning") return "reviewing";
	return "mastered";
}

export default function PracticeSession({
	cards,
	onClose,
	onRestart,
}: {
	cards: FlashcardItem[];
	onClose: () => void;
	onRestart: () => void;
}) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { getElapsedSeconds } = usePracticeTimer();

	const [currentIndex, setCurrentIndex] = useState(0);
	const [flipped, setFlipped] = useState(false);
	const [results, setResults] = useState<{
		known: string[];
		unknown: string[];
	}>({ known: [], unknown: [] });
	const [phase, setPhase] = useState<"session" | "results">("session");

	const audioRef = useRef<HTMLAudioElement | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);

	const updateWordMastery = useMutation(
		trpc.vocabulary.updateWordMastery.mutationOptions({}),
	);
	const updatePhraseMastery = useMutation(
		trpc.vocabulary.updatePhraseMastery.mutationOptions({}),
	);
	const recordPracticeTime = useMutation(
		trpc.practice.recordPracticeTime.mutationOptions({}),
	);

	const currentCard = cards[currentIndex];
	const progressValue =
		cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0;

	const playAudio = useCallback((url: string) => {
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current = null;
		}
		const audio = new Audio(url);
		audioRef.current = audio;
		setIsPlaying(true);
		audio.onended = () => {
			setIsPlaying(false);
			audioRef.current = null;
		};
		audio.onerror = () => {
			setIsPlaying(false);
			audioRef.current = null;
		};
		audio.play().catch(() => setIsPlaying(false));
	}, []);

	const handleAnswer = useCallback(
		(known: boolean) => {
			const card = cards[currentIndex];
			if (!card) return;

			setResults((prev) => ({
				known: known ? [...prev.known, card.id] : prev.known,
				unknown: known ? prev.unknown : [...prev.unknown, card.id],
			}));

			if (known) {
				const newMastery = advanceMastery(card.currentMastery);
				if (card.type === "word") {
					updateWordMastery.mutate({
						userWordId: card.id,
						mastery: newMastery,
					});
				} else {
					updatePhraseMastery.mutate({
						userPhraseId: card.id,
						mastery: newMastery,
					});
				}
			}

			if (currentIndex + 1 >= cards.length) {
				setPhase("results");
				recordPracticeTime.mutate({
					activityType: "vocabulary",
					durationSeconds: getElapsedSeconds(),
				});
				queryClient.invalidateQueries({
					queryKey: trpc.vocabulary.getWords.queryKey(),
				});
				queryClient.invalidateQueries({
					queryKey: trpc.vocabulary.getPhrases.queryKey(),
				});
			} else {
				setCurrentIndex((i) => i + 1);
				setFlipped(false);
			}
		},
		[
			cards,
			currentIndex,
			queryClient,
			trpc,
			updateWordMastery,
			updatePhraseMastery,
		],
	);

	const handleFlip = useCallback(() => {
		if (!flipped) setFlipped(true);
	}, [flipped]);

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (phase !== "session") return;
			if (e.key === " " || e.key === "Enter") {
				e.preventDefault();
				if (!flipped) {
					handleFlip();
				}
			}
			if (flipped) {
				if (e.key === "ArrowLeft" || e.key === "1") {
					e.preventDefault();
					handleAnswer(false);
				}
				if (e.key === "ArrowRight" || e.key === "2") {
					e.preventDefault();
					handleAnswer(true);
				}
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [phase, flipped, handleFlip, handleAnswer]);

	if (phase === "results") {
		return (
			<div className="fixed inset-0 z-50 flex flex-col bg-linear-to-b from-sky-100/80 via-sky-50/60 to-white">
				<div className="flex items-center justify-end p-4">
					<button
						type="button"
						onClick={onClose}
						className="flex size-10 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-white/60 hover:text-neutral-600"
					>
						<X className="size-5" />
					</button>
				</div>

				<div className="flex flex-1 flex-col items-center justify-center px-4">
					<div className="w-full max-w-md text-center">
						<div className="mx-auto mb-5 flex size-20 items-center justify-center rounded-full bg-lime-100">
							<Check className="size-10 text-lime-600" />
						</div>
						<h2 className="mb-2 font-bold font-lyon text-3xl tracking-tight">
							Session Complete
						</h2>
						<p className="mb-8 text-muted-foreground">
							You reviewed {cards.length}{" "}
							{cards.length === 1 ? "item" : "items"}
						</p>

						<div className="mb-8 grid grid-cols-2 gap-4">
							<div className="rounded-2xl border border-lime-100 bg-white p-5 shadow-sm">
								<p className="font-bold text-3xl text-lime-600">
									{results.known.length}
								</p>
								<p className="mt-1 text-muted-foreground text-sm">Know</p>
							</div>
							<div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
								<p className="font-bold text-3xl text-orange-500">
									{results.unknown.length}
								</p>
								<p className="mt-1 text-muted-foreground text-sm">
									Don&apos;t know
								</p>
							</div>
						</div>

						{results.known.length === cards.length && (
							<p className="mb-6 font-medium text-lime-700">
								Perfect score! All items correct.
							</p>
						)}

						<div className="flex gap-3">
							<Button
								variant="outline"
								onClick={onClose}
								className="flex-1 rounded-xl bg-white"
							>
								Done
							</Button>
							<Button
								onClick={onRestart}
								className="flex-1 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800"
							>
								<RotateCcw className="mr-1.5 size-4" />
								Practice Again
							</Button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (!currentCard) return null;

	return (
		<div className="fixed inset-0 z-50 flex flex-col bg-neutral-50">
			{/* Header */}
			<div className="flex items-center gap-4 px-4 pt-4 pb-2">
				<span className="shrink-0 font-medium text-neutral-500 text-sm">
					{currentIndex + 1} <span className="text-neutral-300">/</span>{" "}
					{cards.length}
				</span>
				<Progress
					value={progressValue}
					className="h-2 flex-1 bg-white/60 [&>div]:bg-lime-500"
				/>
				<button
					type="button"
					onClick={onClose}
					className="flex size-10 shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-white/60 hover:text-neutral-600"
				>
					<X className="size-5" />
				</button>
			</div>

			{/* Card area */}
			<div className="flex flex-1 flex-col items-center justify-center px-4">
				<button
					type="button"
					onClick={handleFlip}
					className={cn(
						"flex w-full max-w-2xl select-none flex-col items-center justify-center rounded-2xl border bg-white p-8 shadow-sm transition-all md:min-h-[320px] md:p-12",
						!flipped && "cursor-pointer hover:shadow-md",
					)}
				>
					{!flipped ? (
						<>
							<p className="max-w-md font-bold text-3xl text-neutral-900 tracking-tight md:text-4xl">
								{currentCard.prompt}
							</p>
							{currentCard.detail && (
								<p className="mt-4 max-w-md text-base text-neutral-400 italic">
									{currentCard.detail}
								</p>
							)}
						</>
					) : (
						<>
							<div className="mb-2 flex items-center gap-3">
								<p className="font-bold text-3xl text-neutral-900 tracking-tight md:text-4xl">
									{currentCard.answer}
								</p>
								{currentCard.audioUrl && (
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											if (currentCard.audioUrl) playAudio(currentCard.audioUrl);
										}}
										className="flex size-9 items-center justify-center rounded-full bg-neutral-100 transition-colors hover:bg-neutral-200"
									>
										<Volume2
											className={cn(
												"size-4 text-neutral-500",
												isPlaying && "animate-pulse text-lime-600",
											)}
										/>
									</button>
								)}
							</div>
							{currentCard.ipa && (
								<p className="mb-3 text-lg text-neutral-400">
									{currentCard.ipa}
								</p>
							)}
							{currentCard.detail && (
								<p className="mt-2 max-w-md text-base text-neutral-500 italic">
									{currentCard.detail}
								</p>
							)}
						</>
					)}
				</button>

				{/* Hint / Action buttons */}
				<div className="mt-6 flex min-h-[80px] flex-col items-center justify-center">
					{!flipped ? (
						<p className="text-neutral-400 text-sm">
							Try guessing first, then click on the card or{" "}
							<kbd className="rounded border border-neutral-200 bg-white px-1.5 py-0.5 font-mono text-xs">
								Space
							</kbd>{" "}
							to reveal the answer
						</p>
					) : (
						<div className="flex items-center gap-6">
							<button
								type="button"
								onClick={() => handleAnswer(false)}
								className="group flex flex-col items-center gap-2"
							>
								<span className="flex size-16 items-center justify-center rounded-full border-2 border-orange-200 bg-orange-50 transition-all group-hover:border-orange-300 group-hover:bg-orange-100">
									<X className="size-6 text-orange-500" />
								</span>
								<span className="font-medium text-neutral-500 text-sm">
									Don&apos;t know
								</span>
							</button>
							<button
								type="button"
								onClick={() => handleAnswer(true)}
								className="group flex flex-col items-center gap-2"
							>
								<span className="flex size-16 items-center justify-center rounded-full border-2 border-lime-200 bg-lime-50 transition-all group-hover:border-lime-300 group-hover:bg-lime-100">
									<Check className="size-6 text-lime-600" />
								</span>
								<span className="font-medium text-neutral-500 text-sm">
									Know
								</span>
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
