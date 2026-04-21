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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const PART_OF_SPEECH_OPTIONS = [
	"noun",
	"verb",
	"adjective",
	"adverb",
	"pronoun",
	"preposition",
	"conjunction",
	"interjection",
	"determiner",
	"other",
] as const;

export interface EditWordValues {
	partOfSpeech?: string | null;
	definition?: string | null;
	exampleSentence?: string | null;
	translation?: string | null;
}

export interface EditWordTarget {
	lemma: string;
	partOfSpeech: string | null;
	definition: string;
	exampleSentence: string | null;
	translation: string | null;
	customPartOfSpeech: string | null;
	customDefinition: string | null;
	customExampleSentence: string | null;
	customTranslation: string | null;
}

export default function EditWordDialog({
	open,
	onOpenChange,
	target,
	onSubmit,
	isPending,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	target: EditWordTarget | null;
	onSubmit: (values: EditWordValues) => void;
	isPending: boolean;
}) {
	const [partOfSpeech, setPartOfSpeech] = useState("");
	const [definition, setDefinition] = useState("");
	const [exampleSentence, setExampleSentence] = useState("");
	const [translation, setTranslation] = useState("");

	useEffect(() => {
		if (!target) return;
		setPartOfSpeech(target.partOfSpeech ?? "");
		setDefinition(target.definition ?? "");
		setExampleSentence(target.exampleSentence ?? "");
		setTranslation(target.translation ?? "");
	}, [target]);

	if (!target) return null;

	const handleSave = () => {
		const next: EditWordValues = {};

		const trimmedPos = partOfSpeech.trim();
		const effectivePos = target.partOfSpeech ?? "";
		if (trimmedPos && trimmedPos !== effectivePos) {
			next.partOfSpeech = trimmedPos;
		} else if (!trimmedPos && target.customPartOfSpeech) {
			next.partOfSpeech = null;
		}

		const trimmedDef = definition.trim();
		if (trimmedDef && trimmedDef !== (target.definition ?? "")) {
			next.definition = trimmedDef;
		} else if (!trimmedDef && target.customDefinition) {
			next.definition = null;
		}

		const trimmedExample = exampleSentence.trim();
		if (trimmedExample && trimmedExample !== (target.exampleSentence ?? "")) {
			next.exampleSentence = trimmedExample;
		} else if (!trimmedExample && target.customExampleSentence) {
			next.exampleSentence = null;
		}

		const trimmedTranslation = translation.trim();
		if (trimmedTranslation && trimmedTranslation !== (target.translation ?? "")) {
			next.translation = trimmedTranslation;
		} else if (!trimmedTranslation && target.customTranslation) {
			next.translation = null;
		}

		onSubmit(next);
	};

	const resetField = (field: keyof EditWordTarget) => {
		if (field === "customPartOfSpeech") setPartOfSpeech(target.partOfSpeech ?? "");
		if (field === "customDefinition") setDefinition(target.definition ?? "");
		if (field === "customExampleSentence")
			setExampleSentence(target.exampleSentence ?? "");
		if (field === "customTranslation") setTranslation(target.translation ?? "");
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="font-bold font-lyon text-xl">
						Edit “{target.lemma}”
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 py-2">
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label htmlFor="pos">Part of speech</Label>
							{target.customPartOfSpeech ? (
								<button
									type="button"
									className="cursor-pointer text-muted-foreground text-xs hover:text-foreground"
									onClick={() => {
										setPartOfSpeech("");
										resetField("customPartOfSpeech");
									}}
								>
									Reset to AI default
								</button>
							) : null}
						</div>
						<Select value={partOfSpeech} onValueChange={setPartOfSpeech}>
							<SelectTrigger id="pos" className="w-full rounded-xl">
								<SelectValue placeholder="Select…" />
							</SelectTrigger>
							<SelectContent className="rounded-xl">
								{PART_OF_SPEECH_OPTIONS.map((pos) => (
									<SelectItem key={pos} value={pos}>
										{pos}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label htmlFor="translation">Translation</Label>
							{target.customTranslation ? (
								<button
									type="button"
									className="cursor-pointer text-muted-foreground text-xs hover:text-foreground"
									onClick={() => resetField("customTranslation")}
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
							<Label htmlFor="definition">Definition</Label>
							{target.customDefinition ? (
								<button
									type="button"
									className="cursor-pointer text-muted-foreground text-xs hover:text-foreground"
									onClick={() => resetField("customDefinition")}
								>
									Reset to AI default
								</button>
							) : null}
						</div>
						<Textarea
							id="definition"
							rows={2}
							value={definition}
							onChange={(e) => setDefinition(e.target.value)}
						/>
					</div>

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label htmlFor="example">Example sentence</Label>
							{target.customExampleSentence ? (
								<button
									type="button"
									className="cursor-pointer text-muted-foreground text-xs hover:text-foreground"
									onClick={() => resetField("customExampleSentence")}
								>
									Reset to AI default
								</button>
							) : null}
						</div>
						<Textarea
							id="example"
							rows={2}
							value={exampleSentence}
							onChange={(e) => setExampleSentence(e.target.value)}
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
