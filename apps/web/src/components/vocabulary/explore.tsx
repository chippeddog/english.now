import { env } from "@english.now/env/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	ArrowLeft,
	Briefcase,
	Check,
	ChefHat,
	ChevronRight,
	Code,
	GraduationCap,
	Loader2,
	Palette,
	Plane,
	Plus,
	Sparkles,
	Stethoscope,
	Users,
	Wand2,
} from "lucide-react";
import { useCallback, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/utils/trpc";
import { Button } from "../ui/button";

interface VocabularyCategory {
	id: string;
	name: string;
	icon: React.ReactNode;
	description: string;
	color: string;
}

interface GeneratedWord {
	word: string;
	translation: string;
	definition: string;
	level: string;
	category: string;
	tags: string[];
}

interface GeneratedPhrase {
	phrase: string;
	meaning: string;
	exampleUsage: string;
	category: string;
	level: string;
	literalTranslation: string;
	tags: string[];
}

const VOCABULARY_CATEGORIES: VocabularyCategory[] = [
	{
		id: "Business & Finance",
		name: "Business & Finance",
		icon: <Briefcase className="h-5 w-5" />,
		description: "Professional vocabulary for the workplace",
		color: "from-blue-500 to-indigo-600",
	},
	{
		id: "Technology & IT",
		name: "Technology & IT",
		icon: <Code className="h-5 w-5" />,
		description: "Tech terms and digital vocabulary",
		color: "from-cyan-500 to-blue-600",
	},
	{
		id: "Travel & Tourism",
		name: "Travel & Tourism",
		icon: <Plane className="h-5 w-5" />,
		description: "Essential words for travelers",
		color: "from-orange-500 to-pink-600",
	},
	{
		id: "Healthcare & Medicine",
		name: "Healthcare & Medicine",
		icon: <Stethoscope className="h-5 w-5" />,
		description: "Medical and health-related terms",
		color: "from-green-500 to-emerald-600",
	},
	{
		id: "Food & Cooking",
		name: "Food & Cooking",
		icon: <ChefHat className="h-5 w-5" />,
		description: "Culinary vocabulary",
		color: "from-amber-500 to-orange-600",
	},
	{
		id: "Arts & Culture",
		name: "Arts & Culture",
		icon: <Palette className="h-5 w-5" />,
		description: "Creative and cultural terms",
		color: "from-purple-500 to-pink-600",
	},
	{
		id: "Academic English",
		name: "Academic English",
		icon: <GraduationCap className="h-5 w-5" />,
		description: "Vocabulary for academic writing",
		color: "from-slate-600 to-slate-800",
	},
	{
		id: "Social & Relationships",
		name: "Social & Relationships",
		icon: <Users className="h-5 w-5" />,
		description: "Everyday social interactions",
		color: "from-rose-500 to-red-600",
	},
];

type ListType = "words" | "phrases";

export default function Explore() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
	const [customTopic, setCustomTopic] = useState("");
	const [listType, setListType] = useState<ListType>("words");
	const [isGenerating, setIsGenerating] = useState(false);
	const [generatedWords, setGeneratedWords] = useState<GeneratedWord[]>([]);
	const [generatedPhrases, setGeneratedPhrases] = useState<GeneratedPhrase[]>(
		[],
	);
	const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
	const [isAdding, setIsAdding] = useState(false);

	const addWordsMutation = useMutation(
		trpc.vocabulary.addWords.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.vocabulary.getVocabulary.queryKey(),
				});
			},
		}),
	);

	const addPhrasesMutation = useMutation(
		trpc.vocabulary.addPhrases.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.vocabulary.getPhrases.queryKey(),
				});
			},
		}),
	);

	const generateList = useCallback(async (topic: string, type: ListType) => {
		setIsGenerating(true);
		setGeneratedWords([]);
		setGeneratedPhrases([]);
		setSelectedItems(new Set());

		try {
			const session = await authClient.getSession();
			const headers: Record<string, string> = {
				"Content-Type": "application/json",
			};
			if (session.data?.session) {
				headers.Cookie = `better-auth.session_token=${session.data.session.token}`;
			}

			const response = await fetch(
				`${env.VITE_SERVER_URL}/api/content/generate-list`,
				{
					method: "POST",
					headers,
					credentials: "include",
					body: JSON.stringify({
						topic,
						type,
						count: type === "words" ? 20 : 15,
					}),
				},
			);

			if (!response.ok) {
				throw new Error("Failed to generate list");
			}

			const data = await response.json();
			if (type === "words" && data.words) {
				setGeneratedWords(data.words);
				// Select all by default
				setSelectedItems(
					new Set(data.words.map((_: GeneratedWord, i: number) => i)),
				);
			} else if (type === "phrases" && data.phrases) {
				setGeneratedPhrases(data.phrases);
				setSelectedItems(
					new Set(data.phrases.map((_: GeneratedPhrase, i: number) => i)),
				);
			}
		} catch (error) {
			console.error("Generation error:", error);
		} finally {
			setIsGenerating(false);
		}
	}, []);

	const toggleItem = (index: number) => {
		setSelectedItems((prev) => {
			const next = new Set(prev);
			if (next.has(index)) {
				next.delete(index);
			} else {
				next.add(index);
			}
			return next;
		});
	};

	const toggleAll = () => {
		const totalItems =
			listType === "words" ? generatedWords.length : generatedPhrases.length;
		if (selectedItems.size === totalItems) {
			setSelectedItems(new Set());
		} else {
			setSelectedItems(
				new Set(Array.from({ length: totalItems }, (_, i) => i)),
			);
		}
	};

	const addSelected = async () => {
		setIsAdding(true);
		try {
			if (listType === "words") {
				const wordsToAdd = generatedWords
					.filter((_, i) => selectedItems.has(i))
					.map((w) => ({
						word: w.word,
						translation: w.translation,
						definition: w.definition,
						level: w.level,
						category: w.category,
						tags: w.tags,
					}));
				if (wordsToAdd.length > 0) {
					await addWordsMutation.mutateAsync({
						words: wordsToAdd,
						source: "explore",
					});
				}
			} else {
				const phrasesToAdd = generatedPhrases
					.filter((_, i) => selectedItems.has(i))
					.map((p) => ({
						phrase: p.phrase,
						meaning: p.meaning,
						exampleUsage: p.exampleUsage,
						category: p.category,
						level: p.level,
						literalTranslation: p.literalTranslation,
						tags: p.tags,
					}));
				if (phrasesToAdd.length > 0) {
					await addPhrasesMutation.mutateAsync({
						phrases: phrasesToAdd,
						source: "explore",
					});
				}
			}
			// Reset after successful add
			setGeneratedWords([]);
			setGeneratedPhrases([]);
			setSelectedItems(new Set());
			setSelectedCategory(null);
			setCustomTopic("");
		} finally {
			setIsAdding(false);
		}
	};

	const handleCategoryClick = (categoryName: string) => {
		setSelectedCategory(categoryName);
		generateList(categoryName, listType);
	};

	const handleCustomGenerate = () => {
		if (!customTopic.trim()) return;
		setSelectedCategory(customTopic.trim());
		generateList(customTopic.trim(), listType);
	};

	const resetView = () => {
		setSelectedCategory(null);
		setGeneratedWords([]);
		setGeneratedPhrases([]);
		setSelectedItems(new Set());
		setCustomTopic("");
	};

	const hasResults = generatedWords.length > 0 || generatedPhrases.length > 0;

	return (
		<Dialog
			onOpenChange={(open) => {
				if (!open) resetView();
			}}
		>
			<DialogTrigger asChild>
				<Button
					variant="outline"
					className="group flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-xl border border-neutral-200 bg-linear-to-b from-neutral-50 to-neutral-100 px-2.5 py-1.5 font-medium text-neutral-700 text-sm italic shadow-none transition duration-150 ease-in-out will-change-transform hover:brightness-95 focus:shadow-none focus:outline-none focus-visible:shadow-none"
				>
					Explore
					<span className="-top-px relative font-lyon text-lg text-neutral-700/80 italic group-hover:text-neutral-700">
						lists
					</span>
				</Button>
			</DialogTrigger>
			<DialogContent className="flex max-h-[680px] min-w-4xl flex-col overflow-hidden p-0">
				<DialogHeader className="shrink-0 border-b p-4">
					<div className="flex items-center justify-between">
						<DialogTitle className="font-bold font-lyon text-2xl">
							{selectedCategory ? selectedCategory : "Explore Lists"}
						</DialogTitle>
						{/* List type toggle */}
						<div className="flex items-center gap-1 rounded-xl border border-border/50 bg-muted/50 p-0.5">
							<button
								type="button"
								className={cn(
									"rounded-lg px-3 py-1 font-medium text-sm transition-all",
									listType === "words"
										? "bg-white text-foreground shadow-sm"
										: "text-muted-foreground hover:text-foreground",
								)}
								onClick={() => setListType("words")}
							>
								Words
							</button>
							<button
								type="button"
								className={cn(
									"rounded-lg px-3 py-1 font-medium text-sm transition-all",
									listType === "phrases"
										? "bg-white text-foreground shadow-sm"
										: "text-muted-foreground hover:text-foreground",
								)}
								onClick={() => setListType("phrases")}
							>
								Phrases
							</button>
						</div>
					</div>
				</DialogHeader>

				{/* Custom topic input */}
				<div className="shrink-0 border-b px-4 py-3">
					<div className="flex gap-2">
						<Input
							placeholder="Type any topic... e.g., Job interviews, Cooking, Sports"
							value={customTopic}
							onChange={(e) => setCustomTopic(e.target.value)}
							onKeyDown={(e) =>
								e.key === "Enter" &&
								customTopic.trim() &&
								handleCustomGenerate()
							}
							className="flex-1"
						/>
						<Button
							onClick={handleCustomGenerate}
							disabled={!customTopic.trim() || isGenerating}
							className="gap-2"
							size="sm"
						>
							{isGenerating ? (
								<Loader2 className="size-4 animate-spin" />
							) : (
								<Wand2 className="size-4" />
							)}
							Generate
						</Button>
					</div>
				</div>

				{/* Content area */}
				<div
					className="min-h-0 flex-1 overflow-y-auto"
					style={{ scrollbarWidth: "none" }}
				>
					{/* Back button when viewing results */}
					{selectedCategory && (
						<div className="sticky top-0 z-10 border-b bg-white/95 px-4 py-2 backdrop-blur-sm">
							<div className="flex items-center justify-between">
								<button
									type="button"
									onClick={resetView}
									className="flex items-center gap-1 text-muted-foreground text-sm hover:text-foreground"
								>
									<ArrowLeft className="size-4" />
									Back to categories
								</button>
								{hasResults && (
									<div className="flex items-center gap-2">
										<button
											type="button"
											onClick={toggleAll}
											className="text-muted-foreground text-xs hover:text-foreground"
										>
											{selectedItems.size ===
											(listType === "words"
												? generatedWords.length
												: generatedPhrases.length)
												? "Deselect all"
												: "Select all"}
										</button>
										<Button
											size="sm"
											onClick={addSelected}
											disabled={selectedItems.size === 0 || isAdding}
											className="gap-1.5"
										>
											{isAdding ? (
												<Loader2 className="size-3.5 animate-spin" />
											) : (
												<Plus className="size-3.5" />
											)}
											Add {selectedItems.size} {listType}
										</Button>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Loading state */}
					{isGenerating && (
						<div className="flex flex-col items-center justify-center py-20">
							<div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-linear-to-br from-[#DCFF6F] to-emerald-400">
								<Sparkles className="size-6 animate-pulse text-slate-900" />
							</div>
							<p className="font-medium">
								Generating {listType} for "{selectedCategory}"...
							</p>
							<p className="mt-1 text-muted-foreground text-sm">
								This may take a few seconds
							</p>
						</div>
					)}

					{/* Generated words results */}
					{!isGenerating &&
						generatedWords.length > 0 &&
						listType === "words" && (
							<div className="space-y-1 p-4">
								{generatedWords.map((word, index) => (
									<button
										type="button"
										key={`${word.word}-${index}`}
										onClick={() => toggleItem(index)}
										className={cn(
											"flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all",
											selectedItems.has(index)
												? "border-lime-500/50 bg-lime-50"
												: "border-transparent bg-white hover:bg-neutral-50",
										)}
									>
										<div
											className={cn(
												"flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-all",
												selectedItems.has(index)
													? "border-lime-500 bg-lime-500"
													: "border-neutral-300",
											)}
										>
											{selectedItems.has(index) && (
												<Check className="size-3 text-white" />
											)}
										</div>
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-2">
												<span className="font-semibold">{word.word}</span>
												{word.translation && (
													<span className="text-muted-foreground text-xs">
														{word.translation}
													</span>
												)}
											</div>
											<p className="line-clamp-1 text-muted-foreground text-sm">
												{word.definition}
											</p>
										</div>
										<span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-muted-foreground text-xs">
											{word.level}
										</span>
									</button>
								))}
							</div>
						)}

					{/* Generated phrases results */}
					{!isGenerating &&
						generatedPhrases.length > 0 &&
						listType === "phrases" && (
							<div className="space-y-1 p-4">
								{generatedPhrases.map((phrase, index) => (
									<button
										type="button"
										key={`${phrase.phrase}-${index}`}
										onClick={() => toggleItem(index)}
										className={cn(
											"flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all",
											selectedItems.has(index)
												? "border-lime-500/50 bg-lime-50"
												: "border-transparent bg-white hover:bg-neutral-50",
										)}
									>
										<div
											className={cn(
												"flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-all",
												selectedItems.has(index)
													? "border-lime-500 bg-lime-500"
													: "border-neutral-300",
											)}
										>
											{selectedItems.has(index) && (
												<Check className="size-3 text-white" />
											)}
										</div>
										<div className="min-w-0 flex-1">
											<p className="font-semibold">{phrase.phrase}</p>
											<p className="line-clamp-1 text-muted-foreground text-sm">
												{phrase.meaning}
											</p>
											{phrase.exampleUsage && (
												<p className="line-clamp-1 text-muted-foreground text-xs italic">
													"{phrase.exampleUsage}"
												</p>
											)}
										</div>
										<span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-muted-foreground text-xs">
											{phrase.level}
										</span>
									</button>
								))}
							</div>
						)}

					{/* Category grid (default view) */}
					{!selectedCategory && !isGenerating && (
						<div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
							{VOCABULARY_CATEGORIES.map((category) => (
								<button
									type="button"
									key={category.id}
									onClick={() => handleCategoryClick(category.name)}
									className="group rounded-2xl border bg-white p-3 text-left transition-all hover:shadow-sm"
								>
									<div
										className={cn(
											"mb-4 flex size-9 items-center justify-center rounded-xl bg-linear-to-br text-white",
											category.color,
										)}
									>
										{category.icon}
									</div>
									<h3 className="font-semibold">{category.name}</h3>
									<p className="mt-1 line-clamp-2 text-muted-foreground text-sm">
										{category.description}
									</p>
									<div className="mt-3 flex items-center justify-between">
										<span className="text-muted-foreground text-xs">
											AI-generated {listType}
										</span>
										<ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
									</div>
								</button>
							))}
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
