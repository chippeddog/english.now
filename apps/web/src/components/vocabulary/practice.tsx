import { useQuery } from "@tanstack/react-query";
import { BookOpen, Mic, Sparkles } from "lucide-react";
import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/utils/trpc";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import PracticeSession, { type FlashcardItem } from "./practice-session";

type PracticeContent = "words" | "phrases";

const MASTERY_PRIORITY: Record<string, number> = {
	new: 0,
	learning: 1,
	reviewing: 2,
	mastered: 3,
};

function shuffle<T>(arr: T[]): T[] {
	const copy = [...arr];
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		const tmp = copy[i];
		copy[i] = copy[j] as T;
		copy[j] = tmp as T;
	}
	return copy;
}

const ITEM_COUNTS = [5, 10, 15, 20] as const;

export default function Practice() {
	const trpc = useTRPC();

	const { data: words } = useQuery(
		trpc.vocabulary.getWords.queryOptions({ limit: 200 }),
	);
	const { data: phrases } = useQuery(
		trpc.vocabulary.getPhrases.queryOptions({ limit: 100 }),
	);

	const [setupOpen, setSetupOpen] = useState(false);
	const [selectedContent, setSelectedContent] = useState<PracticeContent[]>([
		"words",
	]);
	const [itemCount, setItemCount] = useState<number>(10);

	const [sessionCards, setSessionCards] = useState<FlashcardItem[] | null>(
		null,
	);

	const wordCount = words?.filter((w) => w.mastery !== "mastered").length ?? 0;
	const phraseCount =
		phrases?.filter((p) => p.mastery !== "mastered").length ?? 0;

	const toggleContent = (id: PracticeContent) => {
		setSelectedContent((prev) =>
			prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
		);
	};

	const buildCards = (): FlashcardItem[] => {
		const items: FlashcardItem[] = [];

		if (selectedContent.includes("words") && words) {
			for (const w of words) {
				items.push({
					id: w.userWordId,
					type: "word",
					prompt: w.translation ?? w.definition,
					answer: w.lemma,
					ipa: w.ipa,
					audioUrl: w.audioUrl,
					detail: w.exampleSentence,
					level: w.level,
					currentMastery: w.mastery,
				});
			}
		}

		if (selectedContent.includes("phrases") && phrases) {
			for (const p of phrases) {
				items.push({
					id: p.userPhraseId,
					type: "phrase",
					prompt: p.translation ?? p.meaning,
					answer: p.text,
					ipa: p.ipa,
					audioUrl: p.audioUrl,
					detail: p.exampleUsage,
					level: p.level,
					currentMastery: p.mastery,
				});
			}
		}

		items.sort(
			(a, b) =>
				(MASTERY_PRIORITY[a.currentMastery] ?? 4) -
				(MASTERY_PRIORITY[b.currentMastery] ?? 4),
		);

		return shuffle(items.slice(0, itemCount));
	};

	const handleStart = () => {
		const cards = buildCards();
		if (cards.length === 0) return;
		setSetupOpen(false);
		setSessionCards(cards);
	};

	const handleSessionClose = () => {
		setSessionCards(null);
	};

	const handleRestart = () => {
		const cards = buildCards();
		if (cards.length === 0) return;
		setSessionCards(null);
		requestAnimationFrame(() => setSessionCards(cards));
	};

	const canStart =
		selectedContent.length > 0 &&
		((selectedContent.includes("words") && wordCount > 0) ||
			(selectedContent.includes("phrases") && phraseCount > 0));

	const contentOptions = [
		{
			id: "words" as PracticeContent,
			label: "Words",
			icon: <BookOpen className="size-4" />,
			count: wordCount,
		},
		{
			id: "phrases" as PracticeContent,
			label: "Phrases",
			icon: <Sparkles className="size-4" />,
			count: phraseCount,
		},
	];

	return (
		<>
			<Dialog open={setupOpen} onOpenChange={setSetupOpen}>
				<DialogTrigger asChild>
					<Button
						type="button"
						variant="outline"
						className="group flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-xl border border-[#C6F64D] bg-[radial-gradient(100%_100%_at_50%_0%,#EFFF9B_0%,#D8FF76_60%,#C6F64D_100%)] px-2.5 py-1.5 font-medium text-lime-900 text-sm italic shadow-none transition duration-150 ease-in-out will-change-transform hover:bg-lime-700/10 hover:brightness-95 focus:shadow-none focus:outline-none focus-visible:shadow-none"
					>
						<Mic className="size-4" />
						Practice
					</Button>
				</DialogTrigger>

				<DialogContent>
					<DialogHeader>
						<DialogTitle className="font-bold font-lyon text-2xl tracking-tight">
							Quick Practice
						</DialogTitle>
						<DialogDescription className="text-neutral-500">
							Flash through your vocabulary
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-5 pb-2">
						<div className="space-y-3">
							<h3 className="font-semibold text-neutral-700 text-sm uppercase tracking-wide">
								What to practice
							</h3>
							<div className="flex gap-2">
								{contentOptions.map((option) => (
									<button
										key={option.id}
										type="button"
										onClick={() => toggleContent(option.id)}
										className={cn(
											"flex flex-1 cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all",
											selectedContent.includes(option.id)
												? "border-lime-400 bg-lime-50"
												: "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50",
										)}
									>
										<Checkbox
											checked={selectedContent.includes(option.id)}
											onCheckedChange={() => toggleContent(option.id)}
											tabIndex={-1}
											className="pointer-events-none data-[state=checked]:border-lime-500 data-[state=checked]:bg-lime-500"
										/>
										<span className="flex items-center gap-2 text-neutral-700">
											{option.icon}
											{option.label}
										</span>
										<span className="ml-auto font-medium text-neutral-400 text-xs">
											{option.count}
										</span>
									</button>
								))}
							</div>
						</div>

						<div className="space-y-3">
							<h3 className="font-semibold text-neutral-700 text-sm uppercase tracking-wide">
								How many
							</h3>
							<div className="flex gap-2">
								{ITEM_COUNTS.map((n) => (
									<button
										key={n}
										type="button"
										onClick={() => setItemCount(n)}
										className={cn(
											"flex flex-1 items-center justify-center rounded-xl border px-3 py-2.5 font-medium text-sm transition-all",
											itemCount === n
												? "border-lime-400 bg-lime-50 text-lime-700"
												: "border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50",
										)}
									>
										{n}
									</button>
								))}
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="ghost"
							className="flex-1 sm:flex-none"
							onClick={() => setSetupOpen(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={handleStart}
							disabled={!canStart}
							className="flex-1 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 sm:flex-none"
						>
							Start Practice
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{sessionCards && (
				<PracticeSession
					cards={sessionCards}
					onClose={handleSessionClose}
					onRestart={handleRestart}
				/>
			)}
		</>
	);
}
