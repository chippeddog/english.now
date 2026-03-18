import * as PopoverPrimitive from "@radix-ui/react-popover";
import { BookPlus, Loader, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConversationVocabulary } from "@/hooks/use-conversation-vocabulary";
import { cn } from "@/lib/utils";

type WordPopoverProps = {
	sessionId: string;
	text: string;
	mode: "word" | "phrase";
	selectionCount?: number;
	anchorEl: HTMLElement;
	onClose: () => void;
};

export function WordPopover({
	sessionId,
	text,
	mode,
	selectionCount,
	anchorEl,
	onClose,
}: WordPopoverProps) {
	const { addVocabulary, isPending } = useConversationVocabulary(sessionId);

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
					<p className="mb-2.5 text-center font-semibold text-sm">"{text}"</p>

					{mode === "word" ? (
						<div className="flex flex-col gap-2">
							<Button
								size="sm"
								className="w-full justify-start gap-2 rounded-lg"
								onClick={() =>
									addVocabulary(
										{
											text: text.toLowerCase(),
											mode: "word",
										},
										{ onSuccess: () => onClose() },
									)
								}
								disabled={isPending}
							>
								{isPending ? (
									<Loader className="size-3.5 animate-spin" />
								) : (
									<BookPlus className="size-3.5" />
								)}
								Add word
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
								onClick={() =>
									addVocabulary(
										{
											text,
											mode: "phrase",
										},
										{ onSuccess: () => onClose() },
									)
								}
								disabled={!canSavePhrase || isPending}
							>
								{isPending ? (
									<Loader className="size-3.5 animate-spin" />
								) : (
									<MessageSquarePlus className="size-3.5" />
								)}
								Add phrase
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
