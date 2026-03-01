import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageSquare, Plus, Trash2, Volume2 } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/utils/trpc";

const MASTERY_LABELS: Record<string, string> = {
	new: "New",
	learning: "Learning",
	reviewing: "Reviewing",
	mastered: "Mastered",
};

const LEVEL_COLORS: Record<string, { bg: string }> = {
	A1: { bg: "bg-emerald-500" },
	A2: { bg: "bg-teal-500" },
	B1: { bg: "bg-blue-500" },
	B2: { bg: "bg-indigo-500" },
	C1: { bg: "bg-purple-500" },
	C2: { bg: "bg-rose-500" },
};

export default function Phrases() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { data: phrases, isLoading } = useQuery(
		trpc.vocabulary.getPhrases.queryOptions({ limit: 100 }),
	);

	const [viewMode, setViewMode] = useState<"grid" | "list">("list");
	const [addDialogOpen, setAddDialogOpen] = useState(false);
	const [newPhrase, setNewPhrase] = useState("");

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
				<Loader2 className="size-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!phrases || phrases.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-white/50 py-16 pb-24 dark:bg-slate-900/50">
				<div className="flex w-32 items-center justify-center">
					<img src="/icons/empty.png" alt="Empty state" />
				</div>
				<div className="mb-6 flex flex-col items-center justify-center gap-3">
					<h3 className="font-semibold text-lg">No phrases added yet</h3>
					<p className="max-w-sm text-center text-muted-foreground">
						Add phrases manually to build your collection.
					</p>
				</div>
				<Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
					<DialogTrigger asChild>
						<Button className="group flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-xl border border-neutral-200 bg-linear-to-b from-neutral-50 to-neutral-100 px-2.5 py-1.5 font-medium text-neutral-700 text-sm shadow-none transition duration-150 ease-in-out will-change-transform hover:brightness-95 focus:shadow-none focus:outline-none focus-visible:shadow-none">
							<Plus className="size-4" />
							Add Manually
						</Button>
					</DialogTrigger>
					<AddPhraseDialogContent
						newPhrase={newPhrase}
						setNewPhrase={setNewPhrase}
						onSubmit={handleAddPhrase}
						isPending={addPhraseMutation.isPending}
					/>
				</Dialog>
			</div>
		);
	}

	return (
		<div>
			<div className="mb-4 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span className="font-medium text-lg">Phrases</span>
				</div>
				<div className="flex items-center gap-2">
					<Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
						<DialogTrigger asChild>
							<button
								type="button"
								className="relative flex size-8 shrink-0 cursor-pointer items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-xl bg-linear-to-t from-[#202020] to-[#2F2F2F] font-base text-white shadow-[inset_0_1px_4px_0_rgba(255,255,255,0.4)] outline-none backdrop-blur transition-all hover:opacity-90 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none"
							>
								<Plus className="size-4" />
							</button>
						</DialogTrigger>
						<AddPhraseDialogContent
							newPhrase={newPhrase}
							setNewPhrase={setNewPhrase}
							onSubmit={handleAddPhrase}
							isPending={addPhraseMutation.isPending}
						/>
					</Dialog>
				</div>
			</div>

			<div className="space-y-2">
				{filteredPhrases.map((p) => (
					<div
						key={p.userPhraseId}
						className="group flex items-start justify-between rounded-xl border bg-white p-4 transition-all hover:shadow-sm dark:bg-slate-900"
					>
						<div className="flex items-start gap-3">
							<div>
								{p.audioUrl ? (
									<button
										type="button"
										onClick={() => playAudio(p.audioUrl ?? "", p.userPhraseId)}
										className={cn(
											"flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-neutral-100",
											playingId === p.userPhraseId
												? "text-primary"
												: "text-muted-foreground",
										)}
									>
										<Volume2 className="size-4" />
									</button>
								) : (
									<MessageSquare className="size-4" />
								)}
							</div>
							<div className="min-w-0">
								<p className="font-semibold">{p.text}</p>
								<p className="mt-0.5 text-muted-foreground text-sm">
									{p.translation ?? p.meaning}
								</p>
								{p.exampleUsage && (
									<p className="mt-1 text-muted-foreground text-xs italic">
										"{p.exampleUsage}"
									</p>
								)}
							</div>
						</div>
						<div className="flex shrink-0 items-center gap-2">
							<Badge
								variant={
									p.mastery === "mastered"
										? "mastered"
										: p.mastery === "learning"
											? "learning"
											: p.mastery === "new"
												? "notStarted"
												: "secondary"
								}
							>
								{MASTERY_LABELS[p.mastery] ?? p.mastery}
							</Badge>
							<button
								type="button"
								onClick={() =>
									removePhraseMutation.mutate({
										userPhraseId: p.userPhraseId,
									})
								}
								className="ml-1 rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
							>
								<Trash2 className="size-3.5" />
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

// ─── Add Phrase Dialog ────────────────────────────────────────────────────────

function AddPhraseDialogContent({
	newPhrase,
	setNewPhrase,
	onSubmit,
	isPending,
}: {
	newPhrase: string;
	setNewPhrase: React.Dispatch<React.SetStateAction<string>>;
	onSubmit: () => void;
	isPending: boolean;
}) {
	return (
		<DialogContent className="sm:max-w-md">
			<DialogHeader>
				<DialogTitle className="font-bold font-lyon text-xl">
					Add New Phrase
				</DialogTitle>
			</DialogHeader>
			<div className="space-y-4 py-2">
				<div className="space-y-2">
					<Label htmlFor="phrase">Phrase</Label>
					<Input
						id="phrase"
						placeholder='e.g., "Break a leg"'
						value={newPhrase}
						onChange={(e) => setNewPhrase(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") onSubmit();
						}}
					/>
					<p className="text-muted-foreground text-xs">
						Meaning, pronunciation, and translation will be generated
						automatically.
					</p>
				</div>
			</div>
			<div className="flex justify-end gap-2">
				<DialogClose asChild>
					<Button variant="outline">Cancel</Button>
				</DialogClose>
				<Button onClick={onSubmit} disabled={!newPhrase.trim() || isPending}>
					{isPending ? (
						<Loader2 className="mr-2 size-4 animate-spin" />
					) : (
						<Plus className="mr-2 size-4" />
					)}
					Add Phrase
				</Button>
			</div>
		</DialogContent>
	);
}
