import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useUpgradeDialog } from "@/components/dashboard/upgrade-dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import AddWordDialog from "@/components/vocabulary/add-world-dialog";
import usePlaybackFromUrl from "@/hooks/use-playback-from-url";
import { useTRPC } from "@/utils/trpc";
import { Button } from "../ui/button";
import ItemRow from "./item-row";

export default function Words() {
	const trpc = useTRPC();
	const { t } = useTranslation("app");
	const queryClient = useQueryClient();
	const { data: words, isLoading } = useQuery(
		trpc.vocabulary.getWords.queryOptions({ limit: 200 }),
	);
	const { data: access } = useQuery(trpc.vocabulary.getAccess.queryOptions());
	const { openDialog } = useUpgradeDialog();

	const [addDialogOpen, setAddDialogOpen] = useState(false);
	const [newWord, setNewWord] = useState("");
	const [masteryFilter, setMasteryFilter] = useState<
		"all" | "new" | "learning" | "reviewing" | "mastered"
	>("all");

	const { playAudio, playingId } = usePlaybackFromUrl();

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
				if (error.message.includes("FREE_VOCAB_ADD_LIMIT_REACHED")) {
					openDialog();
				}
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

	const filteredWords = useMemo(() => {
		if (!words) return [];
		if (masteryFilter === "all") return words;
		return words.filter((word) => word.mastery === masteryFilter);
	}, [words, masteryFilter]);
	const remainingAdds = access?.adds.remaining;
	const addHelperText =
		access?.isPro || remainingAdds == null
			? undefined
			: `${remainingAdds} word or phrase add${
					remainingAdds === 1 ? "" : "s"
				} left today.`;

	const handleAddWord = () => {
		const trimmed = newWord.trim();
		if (!trimmed) return;
		addWordMutation.mutate({ word: trimmed, source: "manual" });
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-16">
				<Loader className="size-5 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!words || words.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-white/50 py-10 pb-20 dark:bg-slate-900/50">
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
					helperText={addHelperText}
				/>
			</div>
		);
	}

	return (
		<div>
			<div className="mb-4 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span className="font-semibold text-lg">{t("vocabulary.words")}</span>
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
						helperText={addHelperText}
					/>
				</div>
			</div>

			<div className="space-y-2">
				{filteredWords.map((w) => (
					<ItemRow
						key={w.userWordId}
						id={w.userWordId}
						primaryText={w.lemma}
						secondaryText={w.translation ?? w.definition}
						ipa={w.ipa}
						audioUrl={w.audioUrl}
						mastery={w.mastery}
						nextReviewAt={w.nextReviewAt?.toString() ?? null}
						isDue={w.isDue}
						playingId={playingId}
						onPlay={playAudio}
						onDelete={() =>
							removeWordMutation.mutate({ userWordId: w.userWordId })
						}
					/>
				))}
			</div>
		</div>
	);
}
