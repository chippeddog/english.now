import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Loader2,
	MoreHorizontalIcon,
	Plus,
	Trash2,
	Volume2,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import AddWordDialog from "@/components/vocabulary/add-world-dialog";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/utils/trpc";
import { Button } from "../ui/button";

const MASTERY_LABELS: Record<string, string> = {
	new: "New",
	learning: "Learning",
	reviewing: "Reviewing",
	mastered: "Mastered",
};

export default function Words() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { data: words, isLoading } = useQuery(
		trpc.vocabulary.getWords.queryOptions({ limit: 200 }),
	);

	const [addDialogOpen, setAddDialogOpen] = useState(false);
	const [newWord, setNewWord] = useState("");
	const [masteryFilter, setMasteryFilter] = useState<
		"all" | "learning" | "reviewing" | "mastered"
	>("all");

	const audioRef = useRef<HTMLAudioElement | null>(null);
	const [playingId, setPlayingId] = useState<string | null>(null);

	const playAudio = useCallback(
		(url: string, id: string) => {
			if (audioRef.current) {
				audioRef.current.pause();
				audioRef.current = null;
			}
			if (playingId === id) {
				setPlayingId(null);
				return;
			}
			const audio = new Audio(url);
			audioRef.current = audio;
			setPlayingId(id);
			audio.onended = () => {
				setPlayingId(null);
				audioRef.current = null;
			};
			audio.onerror = () => {
				setPlayingId(null);
				audioRef.current = null;
			};
			audio.play().catch(() => setPlayingId(null));
		},
		[playingId],
	);

	const addWordMutation = useMutation(
		trpc.vocabulary.addWord.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.vocabulary.getWords.queryKey(),
				});
				setAddDialogOpen(false);
				setNewWord("");
				toast.success("Word added successfully");
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	const removeWordMutation = useMutation(
		trpc.vocabulary.removeWord.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.vocabulary.getWords.queryKey(),
				});
			},
		}),
	);

	const filteredWords = useMemo(() => words ?? [], [words]);

	const handleAddWord = () => {
		const trimmed = newWord.trim();
		if (!trimmed) return;
		addWordMutation.mutate({ word: trimmed, source: "manual" });
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-16">
				<Loader2 className="size-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!words || words.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-white/50 py-16 pb-24 dark:bg-slate-900/50">
				<div className="flex w-32 items-center justify-center">
					<img src="/icons/empty.png" alt="Empty state" />
				</div>
				<div className="mb-6 flex flex-col items-center justify-center gap-3">
					<h3 className="font-semibold text-lg">No words added yet</h3>
					<p className="max-w-sm text-center text-muted-foreground">
						Add words manually to build your vocabulary.
					</p>
				</div>

				<Button
					className="gap-1.5 rounded-xl border border-neutral-200 bg-linear-to-b from-neutral-50 to-neutral-100 text-neutral-700 italic"
					onClick={() => setAddDialogOpen(true)}
				>
					<Plus className="size-4" />
					Add Your First Word
				</Button>
				<AddWordDialog
					addDialogOpen={addDialogOpen}
					setAddDialogOpen={setAddDialogOpen}
					newWord={newWord}
					setNewWord={setNewWord}
					onSubmit={handleAddWord}
					isPending={addWordMutation.isPending}
				/>
			</div>
		);
	}

	return (
		<div>
			<div className="mb-4 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span className="font-medium text-lg">Words</span>
				</div>
				<div className="flex items-center gap-2">
					<Select
						value={masteryFilter}
						onValueChange={(value) =>
							setMasteryFilter(
								value as "all" | "learning" | "reviewing" | "mastered",
							)
						}
						defaultValue="all"
						disabled={isLoading}
					>
						<SelectTrigger
							size="sm"
							className="max-w-md rounded-xl bg-white italic hover:border-border/80"
						>
							<SelectValue placeholder="All" />
						</SelectTrigger>
						<SelectContent className="rounded-xl" align="end" position="popper">
							<SelectItem value="all">All</SelectItem>
							<SelectItem value="new">New</SelectItem>
							<SelectItem value="learning">Learning</SelectItem>
							<SelectItem value="reviewing">Reviewing</SelectItem>
							<SelectItem value="mastered">Mastered</SelectItem>
						</SelectContent>
					</Select>
					<button
						onClick={() => setAddDialogOpen(true)}
						type="button"
						className="relative flex size-8 shrink-0 cursor-pointer items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-xl bg-linear-to-t from-[#202020] to-[#2F2F2F] font-base text-white shadow-[inset_0_1px_4px_0_rgba(255,255,255,0.4)] outline-none backdrop-blur transition-all hover:opacity-90 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:from-[rgb(192,192,192)] dark:to-[rgb(255,255,255)] dark:shadow-[inset_0_1px_4px_0_rgba(128,128,128,0.2)] dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none"
					>
						<Plus className="size-4" />
					</button>
					<AddWordDialog
						addDialogOpen={addDialogOpen}
						setAddDialogOpen={setAddDialogOpen}
						newWord={newWord}
						setNewWord={setNewWord}
						onSubmit={handleAddWord}
						isPending={addWordMutation.isPending}
					/>
				</div>
			</div>

			<div className="space-y-2">
				{filteredWords.map((w) => (
					<div
						key={w.userWordId}
						className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-border/50 bg-white p-2.5 px-3 text-left transition-colors hover:border-border/80 hover:shadow-xs dark:bg-slate-900"
					>
						<div className="flex items-center gap-3">
							{w.audioUrl ? (
								<button
									type="button"
									onClick={() => playAudio(w.audioUrl ?? "", w.userWordId)}
									className={cn(
										"flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-neutral-100",
										playingId === w.userWordId
											? "text-primary"
											: "text-muted-foreground",
									)}
								>
									<Volume2 className="size-4" />
								</button>
							) : null}
							<div>
								<div className="flex items-center gap-2">
									<span className="truncate text-left font-medium text-sm">
										{w.lemma}
									</span>
									{w.ipa && (
										<span className="text-muted-foreground text-xs">
											{w.ipa}
										</span>
									)}
								</div>
								<p className="line-clamp-1 text-muted-foreground text-sm">
									{w.translation ?? w.definition}
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Badge
								variant={
									w.mastery === "mastered"
										? "mastered"
										: w.mastery === "learning"
											? "learning"
											: w.mastery === "new"
												? "notStarted"
												: "secondary"
								}
							>
								{MASTERY_LABELS[w.mastery] ?? w.mastery}
							</Badge>

							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										className="size-6 hover:bg-neutral-100"
										variant="ghost"
										size="icon"
									>
										<MoreHorizontalIcon className="size-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem
										variant="destructive"
										onClick={() =>
											removeWordMutation.mutate({ userWordId: w.userWordId })
										}
									>
										<Trash2 />
										Delete
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
