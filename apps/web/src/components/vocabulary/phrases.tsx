import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import usePlaybackFromUrl from "@/hooks/use-playback-from-url";
import { useTRPC } from "@/utils/trpc";
import AddPhraseDialogContent from "./add-phrase-dialog";
import ItemRow from "./item-row";

export default function Phrases() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { data: phrases, isLoading } = useQuery(
		trpc.vocabulary.getPhrases.queryOptions({ limit: 100 }),
	);
	const [addDialogOpen, setAddDialogOpen] = useState(false);
	const [newPhrase, setNewPhrase] = useState("");
	const { playAudio, playingId } = usePlaybackFromUrl();

	const addPhraseMutation = useMutation(
		trpc.vocabulary.addPhrase.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.vocabulary.getPhrases.queryKey(),
				});
				setAddDialogOpen(false);
				setNewPhrase("");
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

	const filteredPhrases = useMemo(() => phrases ?? [], [phrases]);

	const handleAddPhrase = () => {
		const trimmed = newPhrase.trim();
		if (!trimmed) return;
		addPhraseMutation.mutate({ phrase: trimmed, source: "manual" });
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-16">
				<Loader className="size-5 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!phrases || phrases.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-white/50 py-10 pb-20 dark:bg-slate-900/50">
				<div className="flex w-32 items-center justify-center">
					<img src="/icons/empty.png" alt="Empty state" />
				</div>
				<div className="mb-6 flex flex-col items-center justify-center gap-3">
					<h3 className="font-semibold text-lg">No phrases added yet</h3>
					<p className="max-w-sm text-center text-muted-foreground">
						Add phrases manually to build your collection.
					</p>
				</div>

				<Button
					onClick={() => setAddDialogOpen(true)}
					className="gap-1.5 rounded-xl border border-neutral-200 bg-linear-to-b from-neutral-50 to-neutral-100 text-neutral-700 italic"
				>
					<Plus className="size-4" />
					Add Manually
				</Button>
				<AddPhraseDialogContent
					newPhrase={newPhrase}
					setNewPhrase={setNewPhrase}
					onSubmit={handleAddPhrase}
					isPending={addPhraseMutation.isPending}
					addDialogOpen={addDialogOpen}
					setAddDialogOpen={setAddDialogOpen}
				/>
			</div>
		);
	}

	return (
		<div>
			<div className="mb-4 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span className="font-semibold text-lg">Phrases</span>
				</div>
				<div className="flex items-center gap-2">
					<button
						onClick={() => setAddDialogOpen(true)}
						type="button"
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
					/>
				</div>
			</div>

			<div className="space-y-2">
				{filteredPhrases.map((p) => (
					<ItemRow
						key={p.userPhraseId}
						id={p.userPhraseId}
						primaryText={p.text}
						secondaryText={p.translation ?? p.meaning}
						ipa={p.ipa}
						audioUrl={p.audioUrl}
						mastery={p.mastery}
						playingId={playingId}
						onPlay={playAudio}
						onDelete={() =>
							removePhraseMutation.mutate({ userPhraseId: p.userPhraseId })
						}
						primaryClassName="font-semibold"
					/>
				))}
			</div>
		</div>
	);
}
