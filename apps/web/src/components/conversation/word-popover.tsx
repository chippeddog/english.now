import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BookPlus, Loader, MessageSquarePlus } from "lucide-react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { toast } from "sonner";
import { useUpgradeDialog } from "@/components/dashboard/upgrade-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/utils/trpc";

type WordPopoverProps = {
	text: string;
	mode: "word" | "phrase";
	selectionCount?: number;
	anchorEl: HTMLElement;
	onClose: () => void;
};

export function WordPopover({
	text,
	mode,
	selectionCount,
	anchorEl,
	onClose,
}: WordPopoverProps) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { openDialog } = useUpgradeDialog();

	const addWord = useMutation(
		trpc.vocabulary.addWord.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.vocabulary.getWords.queryKey(),
				});
				queryClient.invalidateQueries({
					queryKey: trpc.vocabulary.getAccess.queryKey(),
				});
				toast.success(`"${text}" added to vocabulary`);
				onClose();
			},
			onError: (err) => {
				if (err.message.includes("FREE_VOCAB_ADD_LIMIT_REACHED")) {
					openDialog();
				}
				toast.error(err.message ?? "Failed to add word");
			},
		}),
	);

	const addPhrase = useMutation(
		trpc.vocabulary.addPhrase.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.vocabulary.getPhrases.queryKey(),
				});
				queryClient.invalidateQueries({
					queryKey: trpc.vocabulary.getAccess.queryKey(),
				});
				toast.success(`"${text}" added to vocabulary`);
				onClose();
			},
			onError: (err) => {
				if (err.message.includes("FREE_VOCAB_ADD_LIMIT_REACHED")) {
					openDialog();
				}
				toast.error(err.message ?? "Failed to add phrase");
			},
		}),
	);

	const isPending = addWord.isPending || addPhrase.isPending;
	const canSavePhrase = (selectionCount ?? 0) > 1;

	return (
		<PopoverPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
			<PopoverPrimitive.Anchor virtualRef={{ current: anchorEl }} />
			<PopoverPrimitive.Portal>
				<PopoverPrimitive.Content
					side="top"
					align="center"
					sideOffset={8}
					className={cn(
						"z-50 w-64 rounded-xl border bg-white p-3 shadow-lg outline-hidden",
						"data-[state=closed]:animate-out data-[state=open]:animate-in",
						"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
						"data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
						"data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
					)}
					onOpenAutoFocus={(e) => e.preventDefault()}
					onInteractOutside={(e) => {
						const target = e.target as HTMLElement | null;
						if (target?.closest("[data-vocab-token='true']")) {
							e.preventDefault();
						}
					}}
				>
					<p className="mb-2.5 text-center font-semibold text-sm">
						"{text}"
					</p>

					{mode === "word" ? (
						<div className="flex flex-col gap-2">
							<Button
								size="sm"
								className="w-full justify-start gap-2 rounded-lg"
								onClick={() =>
									addWord.mutate({ word: text.toLowerCase(), source: "chat" })
								}
								disabled={isPending}
							>
								{addWord.isPending ? (
									<Loader className="size-3.5 animate-spin" />
								) : (
									<BookPlus className="size-3.5" />
								)}
								Add word to vocabulary
							</Button>
							<p className="text-center text-muted-foreground text-xs">
								Word mode saves one selected word at a time.
							</p>
						</div>
					) : (
						<div className="flex flex-col gap-2">
							<Button
								size="sm"
								className="w-full justify-start gap-2 rounded-lg"
								onClick={() => addPhrase.mutate({ phrase: text, source: "chat" })}
								disabled={!canSavePhrase || isPending}
							>
								{addPhrase.isPending ? (
									<Loader className="size-3.5 animate-spin" />
								) : (
									<MessageSquarePlus className="size-3.5" />
								)}
								Add phrase to vocabulary
							</Button>
							<p className="text-center text-muted-foreground text-xs">
								{canSavePhrase
									? "Phrase mode saves the selected words as one phrase."
									: "Select at least 2 words to save a phrase."}
							</p>
						</div>
					)}
				</PopoverPrimitive.Content>
			</PopoverPrimitive.Portal>
		</PopoverPrimitive.Root>
	);
}
