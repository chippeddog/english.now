import { useMutation } from "@tanstack/react-query";
import { BookPlus, Loader, MessageSquarePlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/utils/trpc";

type WordPopoverProps = {
	word: string;
	anchorEl: HTMLElement;
	onClose: () => void;
};

export function WordPopover({ word, anchorEl, onClose }: WordPopoverProps) {
	const trpc = useTRPC();
	const [phraseMode, setPhraseMode] = useState(false);
	const [phraseText, setPhraseText] = useState(word);
	const phraseInputRef = useRef<HTMLInputElement>(null);

	const addWord = useMutation(
		trpc.vocabulary.addWord.mutationOptions({
			onSuccess: () => {
				toast.success(`"${word}" added to vocabulary`);
				onClose();
			},
			onError: (err) => {
				toast.error(err.message ?? "Failed to add word");
			},
		}),
	);

	const addPhrase = useMutation(
		trpc.vocabulary.addPhrase.mutationOptions({
			onSuccess: () => {
				toast.success(`"${phraseText}" added to vocabulary`);
				onClose();
			},
			onError: (err) => {
				toast.error(err.message ?? "Failed to add phrase");
			},
		}),
	);

	const isPending = addWord.isPending || addPhrase.isPending;

	useEffect(() => {
		if (phraseMode) {
			phraseInputRef.current?.focus();
			phraseInputRef.current?.select();
		}
	}, [phraseMode]);

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
				>
					<p className="mb-2.5 text-center font-semibold text-sm">
						"{word}"
					</p>

					{!phraseMode ? (
						<div className="flex flex-col gap-1.5">
							<Button
								size="sm"
								className="w-full justify-start gap-2 rounded-lg"
								onClick={() =>
									addWord.mutate({ word, source: "chat" })
								}
								disabled={isPending}
							>
								{addWord.isPending ? (
									<Loader className="size-3.5 animate-spin" />
								) : (
									<BookPlus className="size-3.5" />
								)}
								Save Word
							</Button>
							<Button
								size="sm"
								variant="outline"
								className="w-full justify-start gap-2 rounded-lg"
								onClick={() => setPhraseMode(true)}
								disabled={isPending}
							>
								<MessageSquarePlus className="size-3.5" />
								Save as Phrase
							</Button>
						</div>
					) : (
						<div className="flex flex-col gap-2">
							<Input
								ref={phraseInputRef}
								value={phraseText}
								onChange={(e) => setPhraseText(e.target.value)}
								placeholder="Type a phrase..."
								className="rounded-lg text-sm"
								onKeyDown={(e) => {
									if (e.key === "Enter" && phraseText.trim()) {
										addPhrase.mutate({
											phrase: phraseText.trim(),
											source: "chat",
										});
									}
								}}
								disabled={isPending}
							/>
							<div className="flex gap-1.5">
								<Button
									size="sm"
									variant="outline"
									className="flex-1 rounded-lg"
									onClick={() => {
										setPhraseMode(false);
										setPhraseText(word);
									}}
									disabled={isPending}
								>
									Back
								</Button>
								<Button
									size="sm"
									className="flex-1 gap-2 rounded-lg"
									onClick={() =>
										addPhrase.mutate({
											phrase: phraseText.trim(),
											source: "chat",
										})
									}
									disabled={!phraseText.trim() || isPending}
								>
									{addPhrase.isPending ? (
										<Loader className="size-3.5 animate-spin" />
									) : (
										"Save Phrase"
									)}
								</Button>
							</div>
						</div>
					)}
				</PopoverPrimitive.Content>
			</PopoverPrimitive.Portal>
		</PopoverPrimitive.Root>
	);
}
