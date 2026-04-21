import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
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
import usePlaybackFromUrl from "@/hooks/use-playback-from-url";
import { useTRPC } from "@/utils/trpc";
import AddPhraseDialogContent from "./add-phrase-dialog";
import EditPhraseDialog, {
	type EditPhraseTarget,
	type EditPhraseValues,
} from "./edit-phrase-dialog";
import ItemEmptyState from "./item-empty-state";
import ItemRow from "./item-row";
import ItemSkeleton from "./item-skeleton";

const ITEM_SKELETON_KEYS = [
	"phrase-skeleton-1",
	"phrase-skeleton-2",
	"phrase-skeleton-3",
	"phrase-skeleton-4",
	"phrase-skeleton-5",
	"phrase-skeleton-6",
] as const;

export default function Phrases() {
	const trpc = useTRPC();
	const { t } = useTranslation("app");
	const queryClient = useQueryClient();
	const { data: phrases, isLoading } = useQuery(
		trpc.vocabulary.getPhrases.queryOptions({ limit: 100 }),
	);
	const { data: access } = useQuery(trpc.vocabulary.getAccess.queryOptions());
	const { openDialog } = useUpgradeDialog();
	const [addDialogOpen, setAddDialogOpen] = useState(false);
	const [newPhrase, setNewPhrase] = useState("");
	const [masteryFilter, setMasteryFilter] = useState<
		"all" | "new" | "learning" | "reviewing" | "mastered"
	>("all");
	const [editTarget, setEditTarget] = useState<
		(EditPhraseTarget & { userPhraseId: string }) | null
	>(null);
	const { playAudio, playingId } = usePlaybackFromUrl();

	const addPhraseMutation = useMutation(
		trpc.vocabulary.addPhrase.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.vocabulary.getPhrases.queryKey(),
				});
				setAddDialogOpen(false);
				setNewPhrase("");
				toast.success("Phrase added successfully");
			},
			onError: (error) => {
				if (error.message.includes("FREE_VOCAB_ADD_LIMIT_REACHED")) {
					openDialog();
				}
				toast.error(error.message);
			},
		}),
	);

	const removePhraseMutation = useMutation(
		trpc.vocabulary.removePhrase.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.vocabulary.getPhrases.queryKey(),
				});
			},
		}),
	);

	const updatePhraseMutation = useMutation(
		trpc.vocabulary.updatePhrase.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.vocabulary.getPhrases.queryKey(),
				});
				setEditTarget(null);
				toast.success("Phrase updated");
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	const filteredPhrases = useMemo(() => phrases ?? [], [phrases]);
	const remainingAdds = access?.adds.remaining;
	const addHelperText =
		access?.isPro || remainingAdds == null
			? undefined
			: `${remainingAdds} word or phrase add${
					remainingAdds === 1 ? "" : "s"
				} left today.`;

	const handleAddPhrase = () => {
		const trimmed = newPhrase.trim();
		if (!trimmed) return;
		addPhraseMutation.mutate({ phrase: trimmed, source: "manual" });
	};

	const handleSaveEdit = (values: EditPhraseValues) => {
		if (!editTarget) return;
		if (Object.keys(values).length === 0) {
			setEditTarget(null);
			return;
		}
		updatePhraseMutation.mutate({
			userPhraseId: editTarget.userPhraseId,
			...values,
		});
	};

	const isEmpty = !isLoading && (!phrases || phrases.length === 0);

	return (
		<div>
			<div className="mb-4 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span className="font-semibold">{t("vocabulary.phrases")}</span>
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
						disabled={isLoading}
						className="relative flex size-8 shrink-0 cursor-pointer items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-xl bg-linear-to-t from-[#202020] to-[#2F2F2F] font-base text-white shadow-[inset_0_1px_4px_0_rgba(255,255,255,0.4)] outline-none backdrop-blur transition-all hover:opacity-90 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none"
					>
						<Plus className="size-4" />
					</button>
					<AddPhraseDialogContent
						newPhrase={newPhrase}
						setNewPhrase={setNewPhrase}
						onSubmit={handleAddPhrase}
						isPending={addPhraseMutation.isPending}
						addDialogOpen={addDialogOpen}
						setAddDialogOpen={setAddDialogOpen}
						helperText={addHelperText}
					/>
				</div>
			</div>

			{isLoading ? (
				<div className="space-y-2">
					{ITEM_SKELETON_KEYS.map((key) => (
						<ItemSkeleton key={key} />
					))}
				</div>
			) : isEmpty ? (
				<ItemEmptyState
					title="No phrases added yet"
					description="Add phrases manually to build your collection."
					actionLabel="Add Manually"
					onAction={() => setAddDialogOpen(true)}
				/>
			) : (
				<div className="space-y-2">
					{filteredPhrases.map((p) => (
						<ItemRow
							key={p.userPhraseId}
							id={p.userPhraseId}
							primaryText={p.text}
							secondaryText={p.translation ?? p.meaning}
							ipa={p.ipa}
							showIpa={false}
							audioUrl={p.audioUrl}
							mastery={p.mastery}
							nextReviewAt={p.nextReviewAt?.toString() ?? null}
							isDue={p.isDue}
							playingId={playingId}
							onPlay={playAudio}
							onDelete={() =>
								removePhraseMutation.mutate({ userPhraseId: p.userPhraseId })
							}
							onEdit={() =>
								setEditTarget({
									userPhraseId: p.userPhraseId,
									text: p.text,
									meaning: p.meaning,
									exampleUsage: p.exampleUsage,
									translation: p.translation,
									literalTranslation: p.literalTranslation,
									customMeaning: p.customMeaning,
									customExampleUsage: p.customExampleUsage,
									customTranslation: p.customTranslation,
									customLiteralTranslation: p.customLiteralTranslation,
								})
							}
							primaryClassName="font-semibold"
						/>
					))}
				</div>
			)}
			<EditPhraseDialog
				open={editTarget !== null}
				onOpenChange={(open) => {
					if (!open) setEditTarget(null);
				}}
				target={editTarget}
				onSubmit={handleSaveEdit}
				isPending={updatePhraseMutation.isPending}
			/>
		</div>
	);
}
