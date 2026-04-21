import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface EditPhraseValues {
	meaning?: string | null;
	exampleUsage?: string | null;
	translation?: string | null;
	literalTranslation?: string | null;
}

export interface EditPhraseTarget {
	text: string;
	meaning: string;
	exampleUsage: string | null;
	translation: string | null;
	literalTranslation: string | null;
	customMeaning: string | null;
	customExampleUsage: string | null;
	customTranslation: string | null;
	customLiteralTranslation: string | null;
}

export default function EditPhraseDialog({
	open,
	onOpenChange,
	target,
	onSubmit,
	isPending,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	target: EditPhraseTarget | null;
	onSubmit: (values: EditPhraseValues) => void;
	isPending: boolean;
}) {
	const [meaning, setMeaning] = useState("");
	const [translation, setTranslation] = useState("");
	const [literalTranslation, setLiteralTranslation] = useState("");
	const [exampleUsage, setExampleUsage] = useState("");

	useEffect(() => {
		if (!target) return;
		setMeaning(target.meaning ?? "");
		setTranslation(target.translation ?? "");
		setLiteralTranslation(target.literalTranslation ?? "");
		setExampleUsage(target.exampleUsage ?? "");
	}, [target]);

	if (!target) return null;

	const handleSave = () => {
		const next: EditPhraseValues = {};

		const trimmedMeaning = meaning.trim();
		if (trimmedMeaning && trimmedMeaning !== (target.meaning ?? "")) {
			next.meaning = trimmedMeaning;
		} else if (!trimmedMeaning && target.customMeaning) {
			next.meaning = null;
		}

		const trimmedTranslation = translation.trim();
		if (trimmedTranslation && trimmedTranslation !== (target.translation ?? "")) {
			next.translation = trimmedTranslation;
		} else if (!trimmedTranslation && target.customTranslation) {
			next.translation = null;
		}

		const trimmedLiteral = literalTranslation.trim();
		if (
			trimmedLiteral &&
			trimmedLiteral !== (target.literalTranslation ?? "")
		) {
			next.literalTranslation = trimmedLiteral;
		} else if (!trimmedLiteral && target.customLiteralTranslation) {
			next.literalTranslation = null;
		}

		const trimmedExample = exampleUsage.trim();
		if (trimmedExample && trimmedExample !== (target.exampleUsage ?? "")) {
			next.exampleUsage = trimmedExample;
		} else if (!trimmedExample && target.customExampleUsage) {
			next.exampleUsage = null;
		}

		onSubmit(next);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="font-bold font-lyon text-xl">
						Edit “{target.text}”
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 py-2">
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label htmlFor="meaning">Meaning</Label>
							{target.customMeaning ? (
								<button
									type="button"
									className="cursor-pointer text-muted-foreground text-xs hover:text-foreground"
									onClick={() => setMeaning(target.meaning ?? "")}
								>
									Reset to AI default
								</button>
							) : null}
						</div>
						<Textarea
							id="meaning"
							rows={2}
							value={meaning}
							onChange={(e) => setMeaning(e.target.value)}
						/>
					</div>

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label htmlFor="translation">Translation</Label>
							{target.customTranslation ? (
								<button
									type="button"
									className="cursor-pointer text-muted-foreground text-xs hover:text-foreground"
									onClick={() => setTranslation(target.translation ?? "")}
								>
									Reset to AI default
								</button>
							) : null}
						</div>
						<Input
							id="translation"
							value={translation}
							onChange={(e) => setTranslation(e.target.value)}
						/>
					</div>

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label htmlFor="literal">Literal translation</Label>
							{target.customLiteralTranslation ? (
								<button
									type="button"
									className="cursor-pointer text-muted-foreground text-xs hover:text-foreground"
									onClick={() =>
										setLiteralTranslation(target.literalTranslation ?? "")
									}
								>
									Reset to AI default
								</button>
							) : null}
						</div>
						<Input
							id="literal"
							value={literalTranslation}
							onChange={(e) => setLiteralTranslation(e.target.value)}
						/>
					</div>

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label htmlFor="example">Example usage</Label>
							{target.customExampleUsage ? (
								<button
									type="button"
									className="cursor-pointer text-muted-foreground text-xs hover:text-foreground"
									onClick={() => setExampleUsage(target.exampleUsage ?? "")}
								>
									Reset to AI default
								</button>
							) : null}
						</div>
						<Textarea
							id="example"
							rows={2}
							value={exampleUsage}
							onChange={(e) => setExampleUsage(e.target.value)}
						/>
					</div>
				</div>
				<div className="flex justify-end gap-2">
					<DialogClose asChild>
						<Button
							variant="ghost"
							className="flex-1 rounded-xl italic sm:flex-none"
						>
							Cancel
						</Button>
					</DialogClose>
					<Button
						className="relative flex shrink-0 cursor-pointer items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-xl bg-linear-to-t from-[#202020] to-[#2F2F2F] font-base text-white italic shadow-[inset_0_1px_4px_0_rgba(255,255,255,0.4)] outline-none backdrop-blur transition-all hover:opacity-90 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40 dark:from-[rgb(192,192,192)] dark:to-[rgb(255,255,255)] dark:shadow-[inset_0_1px_4px_0_rgba(128,128,128,0.2)]"
						onClick={handleSave}
						disabled={isPending}
					>
						Save
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
